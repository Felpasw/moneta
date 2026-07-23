"use client";

import { useEffect, useRef, useState } from "react";

import { API_URL } from "@/globals";
import {
  AgentSessionStatus,
  MicState,
  REALTIME_INPUT_AUDIO_APPEND,
  TTS_AUDIO_MIME,
} from "@/hooks/constants/useAgentSession.constants";
import type {
  UseAgentSessionOptions,
  UseAgentSessionResult,
} from "@/hooks/interfaces/useAgentSession.interface";
import {
  attachMicGraph,
  buildAgentWsUrl,
  makeTtsDispatcher,
  resolveInitialSessionState,
} from "@/hooks/utils/useAgentSession.utils";
import userManager from "@/utils/userManager";

// Re-export pra manter path @/hooks/useAgentSession como fonte de
// importação dos consumers (enums + helper testado).
export { AgentSessionStatus, MicState };
export { buildAgentWsUrl } from "@/hooks/utils/useAgentSession.utils";

export function useAgentSession({
  enabled,
  micEnabled = false,
}: UseAgentSessionOptions): UseAgentSessionResult {
  const [status, setStatus] = useState<AgentSessionStatus>(
    () => resolveInitialSessionState(enabled).status,
  );
  const [error, setError] = useState<string | null>(
    () => resolveInitialSessionState(enabled).error,
  );
  const [isWarming, setIsWarming] = useState<boolean>(
    () => resolveInitialSessionState(enabled).isWarming,
  );
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micState, setMicState] = useState<MicState>(MicState.Off);

  const wsRef = useRef<WebSocket | null>(null);
  const chunksRef = useRef<Uint8Array[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Receive side — WS + TTS playback
  useEffect(() => {
    if (!enabled) return undefined;
    const token = userManager.getAccessToken();
    if (!token) return undefined;

    const ws = new WebSocket(buildAgentWsUrl(API_URL, token));
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
        setStatus(AgentSessionStatus.Speaking);
        setIsWarming(false);
      };
      audio.onended = () => {
        setStatus(AgentSessionStatus.Listening);
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
        setAudioElement(null);
      };
      setAudioElement(audio);
      audio.play().catch(() => {
        setStatus(AgentSessionStatus.Error);
        setError("autoplay blocked");
      });
    };

    const dispatchTts = makeTtsDispatcher({
      onDelta: (bytes) => chunksRef.current.push(bytes),
      onDone: playAssembledChunks,
      onCanceled: () => {
        chunksRef.current = [];
      },
      onError: () => {
        setStatus(AgentSessionStatus.Error);
        setError("tts stream error");
      },
    });

    ws.onopen = () => setStatus(AgentSessionStatus.Listening);
    ws.onerror = () => {
      setStatus(AgentSessionStatus.Error);
      setError("connection error");
    };
    ws.onmessage = (ev: MessageEvent<unknown>) => dispatchTts(ev.data);

    return () => {
      ws.close();
      wsRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
      setAudioElement(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      chunksRef.current = [];
    };
  }, [enabled]);

  // Transmit side — mic capture + PCM16 upload
  useEffect(() => {
    if (!micEnabled) return undefined;

    let stopped = false;
    let teardown: (() => void) | null = null;
    queueMicrotask(() => {
      if (!stopped) setMicState(MicState.Requesting);
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
          setMicState(MicState.Error);
          return;
        }
        teardown = () => {
          graph.teardown();
          stream.getTracks().forEach((t) => t.stop());
        };
        setMicStream(stream);
        setMicState(MicState.Live);
      } catch (err) {
        const name = (err as DOMException | Error).name;
        setMicState(
          name === "NotAllowedError" ? MicState.Denied : MicState.Error,
        );
      }
    };

    void startMic();

    return () => {
      stopped = true;
      teardown?.();
      setMicStream(null);
      setMicState(MicState.Off);
    };
  }, [micEnabled]);

  return {
    status,
    error,
    audioElement,
    isWarming,
    micStream,
    micState,
  };
}
