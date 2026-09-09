import type { TtsVoice } from "@/services/interfaces/assistantProfile.interface";

export interface VoiceCardProps {
  voice: TtsVoice;
  isSelected: boolean;
  isPreviewing: boolean;
  disabled?: boolean;
  onSelect: (voiceId: string) => void;
  onPreview: (voiceId: string) => void;
}
