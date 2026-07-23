import {
  AgentSessionStatus,
  MIC_PROCESSOR_BUFFER_SIZE,
  REALTIME_TARGET_SAMPLE_RATE,
  TTS_EVENT,
} from "@/hooks/constants/useAgentSession.constants";
import type {
  InitialSessionState,
  MicGraph,
  TtsEnvelope,
  TtsHandlers,
  WebkitAudioWindow,
} from "@/hooks/interfaces/useAgentSession.interface";
import { float32ToPcm16Base64 } from "@/utils/pcm";
import userManager from "@/utils/userManager";

// -----------------------------------------------------------------------------
// URL / decoding helpers
// -----------------------------------------------------------------------------

export function buildAgentWsUrl(apiUrl: string, token: string): string {
  const base = apiUrl.replace(/^http/, "ws");
  return `${base}/agent/ws?token=${encodeURIComponent(token)}`;
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
    [TTS_EVENT.delta]: (env) => {
      if (env.audio) handlers.onDelta(base64ToUint8Array(env.audio));
    },
    [TTS_EVENT.done]: () => handlers.onDone(),
    [TTS_EVENT.canceled]: () => handlers.onCanceled(),
    [TTS_EVENT.error]: () => handlers.onError(),
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
  const hasToken = userManager.getAccessToken() !== null;
  if (!hasToken) {
    return {
      status: AgentSessionStatus.Error,
      error: "missing access token",
      isWarming: false,
    };
  }
  return {
    status: AgentSessionStatus.Connecting,
    error: null,
    isWarming: true,
  };
}
