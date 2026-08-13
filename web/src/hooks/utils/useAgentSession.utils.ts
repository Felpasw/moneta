import {
  AgentSessionStatus,
  AgentSocketEvent,
  MIC_PROCESSOR_BUFFER_SIZE,
  REALTIME_TARGET_SAMPLE_RATE,
  ToolEventKind,
} from "@/hooks/constants/useAgentSession.constants";
import type {
  InitialSessionState,
  MicGraph,
  SystemEnvelope,
  SystemHandlers,
  ToolEnvelope,
  ToolEvent,
  TtsEnvelope,
  TtsHandlers,
  WebkitAudioWindow,
} from "@/hooks/interfaces/useAgentSession.interface";
import { useUserStore } from "@/stores/userStore";
import { float32ToPcm16Base64 } from "@/utils/pcm";

// -----------------------------------------------------------------------------
// URL / decoding helpers
// -----------------------------------------------------------------------------

export function buildAgentWsUrl(apiUrl: string): string {
  const base = apiUrl.replace(/^http/, "ws");
  return `${base}/agent/ws`;
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export function resolveAudioContextCtor(): typeof AudioContext | null {
  return (
    window.AudioContext ??
    (window as WebkitAudioWindow).webkitAudioContext ??
    null
  );
}

// -----------------------------------------------------------------------------
// TTS envelope dispatcher (object lookup > if-chain)
// -----------------------------------------------------------------------------

export function makeTtsDispatcher(
  handlers: TtsHandlers,
): (raw: unknown) => void {
  const routes: Record<string, (env: TtsEnvelope) => void> = {
    [AgentSocketEvent.TtsAudioDelta]: (env) => {
      if (env.audio) handlers.onDelta(base64ToUint8Array(env.audio));
    },
    [AgentSocketEvent.TtsAudioDone]: () => handlers.onDone(),
    [AgentSocketEvent.TtsAudioCanceled]: () => handlers.onCanceled(),
    [AgentSocketEvent.TtsAudioError]: () => handlers.onError(),
  };
  return (raw: unknown) => {
    if (typeof raw !== "string") return;
    let envelope: TtsEnvelope;
    try {
      envelope = JSON.parse(raw) as TtsEnvelope;
    } catch {
      return;
    }
    routes[envelope.type]?.(envelope);
  };
}

// -----------------------------------------------------------------------------
// Tool envelope dispatcher (tool.pending / tool.result / tool.error)
// -----------------------------------------------------------------------------

const TOOL_KIND_BY_TYPE: Record<string, ToolEventKind> = {
  [AgentSocketEvent.ToolPending]: ToolEventKind.Pending,
  [AgentSocketEvent.ToolResult]: ToolEventKind.Result,
  [AgentSocketEvent.ToolError]: ToolEventKind.Error,
};

export function makeToolDispatcher(
  onEvent: (event: ToolEvent) => void,
): (raw: unknown) => void {
  return (raw: unknown) => {
    if (typeof raw !== "string") return;
    let envelope: ToolEnvelope;
    try {
      envelope = JSON.parse(raw) as ToolEnvelope;
    } catch {
      return;
    }
    const kind = TOOL_KIND_BY_TYPE[envelope.type];
    if (!kind || !envelope.callId) return;
    onEvent({
      kind,
      callId: envelope.callId,
      toolName: envelope.toolName,
      args: envelope.args,
      result: envelope.result,
      message: envelope.message,
      caption: envelope.caption,
    });
  };
}

// -----------------------------------------------------------------------------
// System envelope dispatcher (system.redirect etc.)
// -----------------------------------------------------------------------------

export function makeSystemDispatcher(
  handlers: SystemHandlers,
): (raw: unknown) => void {
  const routes: Record<string, (env: SystemEnvelope) => void> = {
    [AgentSocketEvent.SystemRedirect]: (env) => {
      if (env.target) handlers.onRedirect(env.target);
    },
  };
  return (raw: unknown) => {
    if (typeof raw !== "string") return;
    let envelope: SystemEnvelope;
    try {
      envelope = JSON.parse(raw) as SystemEnvelope;
    } catch {
      return;
    }
    routes[envelope.type]?.(envelope);
  };
}

// -----------------------------------------------------------------------------
// Mic audio graph
// -----------------------------------------------------------------------------

export function attachMicGraph(params: {
  stream: MediaStream;
  onFrame: (base64: string) => void;
}): MicGraph | null {
  const Ctor = resolveAudioContextCtor();
  if (!Ctor) return null;
  const ctx = new Ctor({ sampleRate: REALTIME_TARGET_SAMPLE_RATE });
  const source = ctx.createMediaStreamSource(params.stream);
  const processor = ctx.createScriptProcessor(MIC_PROCESSOR_BUFFER_SIZE, 1, 1);
  processor.onaudioprocess = (event: AudioProcessingEvent): void => {
    const encoded = float32ToPcm16Base64(event.inputBuffer.getChannelData(0));
    if (encoded.length > 0) params.onFrame(encoded);
  };
  source.connect(processor);
  processor.connect(ctx.destination);
  return {
    teardown: () => {
      processor.disconnect();
      source.disconnect();
      void ctx.close().catch(() => undefined);
    },
  };
}

// -----------------------------------------------------------------------------
// Initial state resolver
// -----------------------------------------------------------------------------

export function resolveInitialSessionState(
  enabled: boolean,
): InitialSessionState {
  if (!enabled) {
    return {
      status: AgentSessionStatus.Idle,
      error: null,
      isWarming: false,
    };
  }
  const hasSession = useUserStore.getState().user !== null;
  if (!hasSession) {
    return {
      status: AgentSessionStatus.Error,
      error: "missing session",
      isWarming: false,
    };
  }
  return {
    status: AgentSessionStatus.Connecting,
    error: null,
    isWarming: true,
  };
}
