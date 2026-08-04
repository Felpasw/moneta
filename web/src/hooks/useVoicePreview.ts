"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoicePreviewOptions {
  readonly fetchPreview: (voiceId: string) => Promise<Blob>;
  readonly disabled?: boolean;
}

interface UseVoicePreviewResult {
  readonly previewingVoiceId: string | null;
  readonly play: (voiceId: string) => Promise<void>;
  readonly stop: () => void;
}

export function useVoicePreview({
  fetchPreview,
  disabled = false,
}: UseVoicePreviewOptions): UseVoicePreviewResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(
    null,
  );

  const releaseBlob = useCallback(() => {
    if (currentBlobUrlRef.current !== null) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current !== null) {
      audioRef.current.pause();
    }
    releaseBlob();
    setPreviewingVoiceId(null);
  }, [releaseBlob]);

  useEffect(() => {
    return () => {
      releaseBlob();
    };
  }, [releaseBlob]);

  const play = useCallback(
    async (voiceId: string) => {
      if (disabled) return;

      stop();

      try {
        const blob = await fetchPreview(voiceId);
        const url = URL.createObjectURL(blob);
        currentBlobUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.addEventListener("ended", () => {
          setPreviewingVoiceId((prev) => (prev === voiceId ? null : prev));
        });

        setPreviewingVoiceId(voiceId);
        await audio.play();
      } catch {
        setPreviewingVoiceId(null);
      }
    },
    [disabled, fetchPreview, stop],
  );

  return { previewingVoiceId, play, stop };
}
