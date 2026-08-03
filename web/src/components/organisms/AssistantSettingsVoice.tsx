"use client";

import { Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { TtsVoice } from "@/services/interfaces/assistantProfile.interface";

interface AssistantSettingsVoiceProps {
  voices: TtsVoice[];
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
  onPreview: (voiceId: string) => Promise<Blob>;
  disabled?: boolean;
  className?: string;
}

export function AssistantSettingsVoice({
  voices,
  selectedVoiceId,
  onSelect,
  onPreview,
  disabled,
  className,
}: AssistantSettingsVoiceProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current !== null) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
    };
  }, []);

  const stopPreview = useCallback(() => {
    if (audioRef.current !== null) {
      audioRef.current.pause();
    }
    if (currentBlobUrlRef.current !== null) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setPreviewingVoiceId(null);
  }, []);

  const handlePreview = async (voiceId: string) => {
    if (disabled) return;

    stopPreview();

    try {
      const blob = await onPreview(voiceId);
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
  };

  const handleSelect = (voiceId: string) => {
    if (disabled) return;
    if (voiceId === selectedVoiceId) return;
    onSelect(voiceId);
  };

  if (voices.length === 0) {
    return (
      <section
        aria-labelledby="assistant-voice-heading"
        className={cn("space-y-4", className)}
      >
        <header className="space-y-1">
          <h2
            id="assistant-voice-heading"
            className="text-lg font-heading font-medium"
          >
            Voz
          </h2>
          <p className="text-sm text-muted-foreground">
            Nenhuma voz disponível no momento.
          </p>
        </header>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="assistant-voice-heading"
      className={cn("space-y-4", className)}
    >
      <header className="space-y-1">
        <h2
          id="assistant-voice-heading"
          className="text-lg font-heading font-medium"
        >
          Voz
        </h2>
        <p className="text-sm text-muted-foreground">
          Escute uma amostra e escolha a voz do assistente.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {voices.map((voice) => {
          const isSelected = voice.voiceId === selectedVoiceId;
          const isPreviewing = previewingVoiceId === voice.voiceId;
          return (
            <li key={voice.voiceId}>
              <div
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors",
                  isSelected && "border-primary bg-primary/5",
                  disabled && "opacity-60",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(voice.voiceId)}
                  aria-pressed={isSelected}
                  aria-label={`Selecionar ${voice.name}`}
                  disabled={disabled}
                  className="flex flex-1 flex-col items-start text-left"
                >
                  <span className="text-sm font-medium">{voice.name}</span>
                  {voice.language !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {voice.language}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handlePreview(voice.voiceId)}
                  disabled={disabled}
                  aria-label={`Ouvir preview de ${voice.name}`}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground",
                    "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                    isPreviewing && "border-primary text-primary",
                  )}
                >
                  <Play className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default AssistantSettingsVoice;
