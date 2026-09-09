"use client";

import { AlertTriangle, Play } from "lucide-react";

import type { VoiceCardProps } from "@/components/molecules/interfaces/VoiceCard.interface";
import { cn } from "@/lib/utils";
import type { TtsVoice } from "@/services/interfaces/assistantProfile.interface";

const LANGUAGE_LABEL: Record<TtsVoice["language"], string> = {
  pt_BR: "Portuguese",
  en_US: "English",
  unknown: "Unknown",
};

export function VoiceCard({
  voice,
  isSelected,
  isPreviewing,
  disabled,
  onSelect,
  onPreview,
}: VoiceCardProps) {
  const showMismatchBadge = voice.languageMatch === "mismatch";
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-2 rounded-lg border border-border bg-background p-3 transition-colors",
        isSelected && "border-primary bg-primary/5",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect(voice.voiceId)}
          aria-pressed={isSelected}
          aria-label={`Select ${voice.name}`}
          disabled={disabled}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium"
        >
          {voice.name}
        </button>
        <button
          type="button"
          onClick={() => onPreview(voice.voiceId)}
          disabled={disabled}
          aria-label={`Preview ${voice.name}`}
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground",
            "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
            isPreviewing && "border-primary text-primary",
          )}
        >
          <Play className="h-4 w-4" />
        </button>
      </div>
      {showMismatchBadge && (
        <span
          data-testid={`voice-mismatch-badge-${voice.voiceId}`}
          className="inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
        >
          <AlertTriangle className="h-3 w-3 flex-shrink-0" aria-hidden />
          <span className="truncate">
            May sound off in {LANGUAGE_LABEL[voice.language]}
          </span>
        </span>
      )}
    </div>
  );
}

export default VoiceCard;
