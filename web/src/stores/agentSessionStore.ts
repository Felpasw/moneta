import { create } from "zustand";

import {
  AgentSessionStatus,
  MicState,
} from "@/hooks/constants/useAgentSession.constants";
import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";

interface AgentSessionState {
  status: AgentSessionStatus;
  error: string | null;
  isWarming: boolean;
  audioElement: HTMLAudioElement | null;
  micEnabled: boolean;
  micStream: MediaStream | null;
  micState: MicState;
  toolEvents: ToolEvent[];
  redirectTarget: string | null;
  interruptionPulse: number;
}

const INITIAL_STATE: AgentSessionState = {
  status: AgentSessionStatus.Idle,
  error: null,
  isWarming: false,
  audioElement: null,
  micEnabled: false,
  micStream: null,
  micState: MicState.Off,
  toolEvents: [],
  redirectTarget: null,
  interruptionPulse: 0,
};

export const useAgentSessionStore = create<AgentSessionState>(() => INITIAL_STATE);

export const agentSessionActions = {
  setStatus: (status: AgentSessionStatus) =>
    useAgentSessionStore.setState({ status }),
  setError: (error: string | null) =>
    useAgentSessionStore.setState({ error }),
  setIsWarming: (isWarming: boolean) =>
    useAgentSessionStore.setState({ isWarming }),
  setAudioElement: (audioElement: HTMLAudioElement | null) =>
    useAgentSessionStore.setState({ audioElement }),
  setMicEnabled: (micEnabled: boolean) =>
    useAgentSessionStore.setState({ micEnabled }),
  toggleMic: () =>
    useAgentSessionStore.setState((s) => ({ micEnabled: !s.micEnabled })),
  setMicStream: (micStream: MediaStream | null) =>
    useAgentSessionStore.setState({ micStream }),
  setMicState: (micState: MicState) =>
    useAgentSessionStore.setState({ micState }),
  appendToolEvent: (event: ToolEvent) =>
    useAgentSessionStore.setState((s) => ({
      toolEvents: [...s.toolEvents, event],
    })),
  setRedirectTarget: (redirectTarget: string | null) =>
    useAgentSessionStore.setState({ redirectTarget }),
  bumpInterruptionPulse: () =>
    useAgentSessionStore.setState((s) => ({
      interruptionPulse: s.interruptionPulse + 1,
    })),
  hydrateInitial: (
    initial: Pick<AgentSessionState, "status" | "error" | "isWarming">,
  ) => useAgentSessionStore.setState(initial),
  resetSession: () =>
    useAgentSessionStore.setState({
      audioElement: null,
      redirectTarget: null,
      toolEvents: [],
    }),
  resetMic: () =>
    useAgentSessionStore.setState({
      micStream: null,
      micState: MicState.Off,
    }),
  resetAll: () => useAgentSessionStore.setState(INITIAL_STATE),
} as const;
