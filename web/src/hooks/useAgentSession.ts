"use client";

import { useEffect, useRef } from "react";

import { API_URL } from "@/globals";
import {
  AgentSessionStatus,
  MicState,
  REALTIME_INPUT_AUDIO_APPEND,
  ToolEventKind,
  TTS_AUDIO_MIME,
} from "@/hooks/constants/useAgentSession.constants";
import type {
  ToolEvent,
  UseAgentSessionOptions,
  UseAgentSessionResult,
} from "@/hooks/interfaces/useAgentSession.interface";
import {
  attachMicGraph,
  buildAgentWsUrl,
  makeSystemDispatcher,
  makeToolDispatcher,
  makeTtsDispatcher,
  resolveInitialSessionState,
  stopPlayback,
} from "@/hooks/utils/useAgentSession.utils";
import {
  agentSessionActions as actions,
  useAgentSessionStore,
} from "@/stores/agentSessionStore";
import { useUserStore } from "@/stores/userStore";

// Re-export pra manter path @/hooks/useAgentSession como fonte de
// importação dos consumers (enums + helper testado).
export { AgentSessionStatus, MicState, ToolEventKind };
export type { ToolEvent };
export { buildAgentWsUrl } from "@/hooks/utils/useAgentSession.utils";

export function useAgentSession({
  enabled,
}: UseAgentSessionOptions): UseAgentSessionResult {
  const state = useAgentSessionStore();
  const micEnabled = state.micEnabled;

  const wsRef = useRef<WebSocket | null>(null);
  const chunksRef = useRef<Uint8Array[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Receive side — WS + TTS playback
  useEffect(() => {
    actions.hydrateInitial(resolveInitialSessionState(enabled));
    if (!enabled) return undefined;
    if (useUserStore.getState().user === null) return undefined;

    let cancelled = false;
    let ws: WebSocket | null = null;

    // StrictMode double-mount em dev cria WS #1, cleanup imediato, WS #2 —
    // o backend loga upstream 1006 do #1. Defer via setTimeout(0) faz o
    // cleanup rodar antes de qualquer `new WebSocket` acontecer.
    const boot = setTimeout(() => {
      if (cancelled) return;

      ws = new WebSocket(buildAgentWsUrl(API_URL));
      wsRef.current = ws;

      const playAssembledChunks = (): void => {
        const bytes = chunksRef.current;
        chunksRef.current = [];
        if (bytes.length === 0) return;
        const blob = new Blob(bytes as BlobPart[], { type: TTS_AUDIO_MIME });
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audio.crossOrigin = "anonymous";
        audioRef.current = audio;
        audio.onplay = () => {
          actions.setStatus(AgentSessionStatus.Speaking);
          actions.setIsWarming(false);
        };
        audio.onended = () => {
          actions.setStatus(AgentSessionStatus.Listening);
          URL.revokeObjectURL(url);
          objectUrlRef.current = null;
          actions.setAudioElement(null);
        };
        actions.setAudioElement(audio);
        audio.play().catch(() => {
          actions.setStatus(AgentSessionStatus.Error);
          actions.setError("autoplay blocked");
        });
      };

      const dispatchTts = makeTtsDispatcher({
        onDelta: (bytes) => chunksRef.current.push(bytes),
        onDone: playAssembledChunks,
        onCanceled: () => {
          stopPlayback({
            audioRef,
            objectUrlRef,
            chunksRef,
            onStopped: () => {
              actions.setAudioElement(null);
              actions.setStatus(AgentSessionStatus.Listening);
            },
          });
        },
        onError: () => {
          actions.setStatus(AgentSessionStatus.Error);
          actions.setError("tts stream error");
        },
      });

      const dispatchTool = makeToolDispatcher(actions.appendToolEvent);

      const dispatchSystem = makeSystemDispatcher({
        onRedirect: actions.setRedirectTarget,
      });

      ws.onopen = () => actions.setStatus(AgentSessionStatus.Listening);
      ws.onerror = () => {
        actions.setStatus(AgentSessionStatus.Error);
        actions.setError("connection error");
      };
      ws.onmessage = (ev: MessageEvent<unknown>) => {
        dispatchTts(ev.data);
        dispatchTool(ev.data);
        dispatchSystem(ev.data);
      };
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(boot);
      ws?.close();
      wsRef.current = null;
      stopPlayback({
        audioRef,
        objectUrlRef,
        chunksRef,
        onStopped: () => actions.resetSession(),
      });
    };
  }, [enabled]);

  // Transmit side — mic capture + PCM16 upload
  useEffect(() => {
    if (!micEnabled) return undefined;

    let stopped = false;
    let teardown: (() => void) | null = null;
    queueMicrotask(() => {
      if (!stopped) actions.setMicState(MicState.Requesting);
    });

    const sendFrame = (audio: string): void => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: REALTIME_INPUT_AUDIO_APPEND, audio }));
    };

    const startMic = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const graph = attachMicGraph({ stream, onFrame: sendFrame });
        if (!graph) {
          stream.getTracks().forEach((t) => t.stop());
          actions.setMicState(MicState.Error);
          return;
        }
        teardown = () => {
          graph.teardown();
          stream.getTracks().forEach((t) => t.stop());
        };
        actions.setMicStream(stream);
        actions.setMicState(MicState.Live);
      } catch (err) {
        const name = (err as DOMException | Error).name;
        actions.setMicState(
          name === "NotAllowedError" ? MicState.Denied : MicState.Error,
        );
      }
    };

    void startMic();

    return () => {
      stopped = true;
      teardown?.();
      actions.resetMic();
    };
  }, [micEnabled]);

  return state;
}
