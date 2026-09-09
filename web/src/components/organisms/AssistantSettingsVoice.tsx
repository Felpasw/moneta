"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

import { VoiceCard } from "@/components/molecules/VoiceCard";
import { useVoicePreview } from "@/hooks/useVoicePreview";
import { cn } from "@/lib/utils";
import type { TtsVoice } from "@/services/interfaces/assistantProfile.interface";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

const MAX_VISIBLE_PER_SECTION = 12;

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
  const { previewingVoiceId, play } = useVoicePreview({
    fetchPreview: onPreview,
    disabled,
  });

  const { recommended, other } = useMemo(() => {
    const recommendedList: TtsVoice[] = [];
    const otherList: TtsVoice[] = [];
    for (const voice of voices) {
      if (voice.languageMatch === "match") {
        recommendedList.push(voice);
      } else {
        otherList.push(voice);
      }
    }
    return {
      recommended: recommendedList.slice(0, MAX_VISIBLE_PER_SECTION),
      other: otherList.slice(0, MAX_VISIBLE_PER_SECTION),
    };
  }, [voices]);

  const handleSelect = (voiceId: string) => {
    if (disabled) return;
    if (voiceId === selectedVoiceId) return;
    onSelect(voiceId);
  };

  const renderCards = (list: TtsVoice[]) => (
    <ul className="grid gap-3 sm:grid-cols-2">
      {list.map((voice) => (
        <li key={voice.voiceId} className="h-full">
          <VoiceCard
            voice={voice}
            isSelected={voice.voiceId === selectedVoiceId}
            isPreviewing={previewingVoiceId === voice.voiceId}
            disabled={disabled}
            onSelect={handleSelect}
            onPreview={play}
          />
        </li>
      ))}
    </ul>
  );

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
            Voice
          </h2>
          <p className="text-sm text-muted-foreground">
            No voices available at the moment.
          </p>
        </header>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="assistant-voice-heading"
      className={cn("space-y-8", className)}
    >
      <motion.header variants={SETTINGS_STAGGER_ITEM} className="space-y-1">
        <h2
          id="assistant-voice-heading"
          className="text-lg font-heading font-medium"
        >
          Voice
        </h2>
        <p className="text-sm text-muted-foreground">
          Listen to a sample and pick your assistant&apos;s voice.
        </p>
      </motion.header>

      {recommended.length > 0 && (
        <motion.div variants={SETTINGS_STAGGER_ITEM} className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Recommended for your language
          </h3>
          {renderCards(recommended)}
        </motion.div>
      )}

      {other.length > 0 && (
        <motion.div variants={SETTINGS_STAGGER_ITEM} className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Other languages
          </h3>
          <p className="text-xs text-muted-foreground">
            These voices weren&apos;t made for the language you picked and may
            sound off.
          </p>
          {renderCards(other)}
        </motion.div>
      )}
    </section>
  );
}

export default AssistantSettingsVoice;
