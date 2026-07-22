"use client";

import { useEffect, useRef, useState } from "react";

import { API_URL } from "@/globals";
import userManager from "@/utils/userManager";

export enum AgentSessionStatus {
  Idle = "idle",
  Connecting = "connecting",
  Listening = "listening",
  Speaking = "speaking",
  Error = "error",
}

interface UseAgentSessionOptions {
  enabled: boolean;
}

interface UseAgentSessionResult {
  status: AgentSessionStatus;
  error: string | null;
  audioElement: HTMLAudioElement | null;
  isWarming: boolean;
}

const TTS_EVENT = {
  delta: "tts.audio.delta",
  done: "tts.audio.done",
  canceled: "tts.audio.canceled",
  error: "tts.audio.error",
} as const;

interface TtsEnvelope {
  type: string;
  audio?: string;
}

export function buildAgentWsUrl(apiUrl: string, token: string): string {
  const base = apiUrl.replace(/^http/, "ws");
  return `${base}/agent/ws?token=${encodeURIComponent(token)}`;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export function useAgentSession({
  enabled,
}: UseAgentSessionOptions): UseAgentSessionResult {
  const [status, setStatus] = useState<AgentSessionStatus>(() => {
    if (!enabled) return AgentSessionStatus.Idle;
    return userManager.getAccessToken()
      ? AgentSessionStatus.Connecting
      : AgentSessionStatus.Error;
  });
  const [error, setError] = useState<string | null>(() => {
    if (!enabled) return null;
    return userManager.getAccessToken() ? null : "missing access token";
  });
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isWarming, setIsWarming] = useState<boolean>(() => {
    if (!enabled) return false;
    return userManager.getAccessToken() !== null;
  });
  const wsRef = useRef<WebSocket | null>(null);
  const chunksRef = useRef<Uint8Array[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const token = userManager.getAccessToken();
    if (!token) return undefined;

    const ws = new WebSocket(buildAgentWsUrl(API_URL, token));
    wsRef.current = ws;

    ws.onopen = () => setStatus(AgentSessionStatus.Listening);
    ws.onerror = () => {
      setStatus(AgentSessionStatus.Error);
      setError("connection error");
    };
    ws.onmessage = (ev: MessageEvent<unknown>) => {
      if (typeof ev.data !== "string") return;
      let parsed: TtsEnvelope;
      try {
        parsed = JSON.parse(ev.data) as TtsEnvelope;
      } catch {
        return;
      }
      if (parsed.type === TTS_EVENT.delta && parsed.audio) {
        chunksRef.current.push(base64ToUint8Array(parsed.audio));
        return;
      }
      if (parsed.type === TTS_EVENT.done) {
        const bytes = chunksRef.current;
        chunksRef.current = [];
        if (bytes.length === 0) return;
        const blob = new Blob(bytes as BlobPart[], { type: "audio/mpeg" });
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
        return;
      }
      if (parsed.type === TTS_EVENT.canceled) {
        chunksRef.current = [];
        return;
      }
      if (parsed.type === TTS_EVENT.error) {
        setStatus(AgentSessionStatus.Error);
        setError("tts stream error");
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audioRef.current = null;
      }
      setAudioElement(null);
      const url = objectUrlRef.current;
      if (url) {
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
      }
      chunksRef.current = [];
    };
  }, [enabled]);

  return { status, error, audioElement, isWarming };
}
