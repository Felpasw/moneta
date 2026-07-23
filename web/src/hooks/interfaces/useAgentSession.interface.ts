import type {
  AgentSessionStatus,
  MicState,
  ToolEventKind,
} from "@/hooks/constants/useAgentSession.constants";

export interface UseAgentSessionOptions {
  enabled: boolean;
  micEnabled?: boolean;
}

export interface ToolEvent {
  kind: ToolEventKind;
  callId: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  message?: string;
}

export interface ToolEnvelope {
  type: string;
  callId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  message?: string;
}

export interface UseAgentSessionResult {
  status: AgentSessionStatus;
  error: string | null;
  audioElement: HTMLAudioElement | null;
  isWarming: boolean;
  micStream: MediaStream | null;
  micState: MicState;
  toolEvents: ToolEvent[];
}

export interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export interface TtsEnvelope {
  type: string;
  audio?: string;
}

export interface TtsHandlers {
  onDelta: (bytes: Uint8Array) => void;
  onDone: () => void;
  onCanceled: () => void;
  onError: () => void;
}

export interface MicGraph {
  teardown: () => void;
}

export interface InitialSessionState {
  status: AgentSessionStatus;
  error: string | null;
  isWarming: boolean;
}
