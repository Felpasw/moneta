import { AssistantAvatarStyle } from "@/components/atoms/AssistantAvatar";
import type { TreatmentStyle } from "@/services/interfaces/assistantProfile.interface";

export interface TreatmentStyleOption {
  value: TreatmentStyle;
  label: string;
  example: string;
  accentClass: string;
}

export const TREATMENT_STYLE_OPTIONS: readonly TreatmentStyleOption[] = [
  {
    value: "formal",
    label: "Formal",
    example:
      "Bom dia, Felipe. Como posso auxiliá-lo com suas finanças hoje?",
    accentClass: "text-blue-400 border-blue-400",
  },
  {
    value: "informal",
    label: "Informal",
    example: "E aí, Felipe! No que te ajudo hoje?",
    accentClass: "text-fuchsia-400 border-fuchsia-400",
  },
  {
    value: "very_informal",
    label: "Muito informal",
    example: "Fala pae, de boa? Bora dar uma olhada nessa grana ae?",
    accentClass: "text-emerald-400 border-emerald-400",
  },
];

export interface AvatarStyleOption {
  value: AssistantAvatarStyle;
  label: string;
}

export const CURATED_AVATAR_STYLE_OPTIONS: readonly AvatarStyleOption[] = [
  { value: AssistantAvatarStyle.NOTIONISTS, label: "Notionists" },
  { value: AssistantAvatarStyle.PERSONAS, label: "Personas" },
  { value: AssistantAvatarStyle.LORELEI, label: "Lorelei" },
  { value: AssistantAvatarStyle.MICAH, label: "Micah" },
  { value: AssistantAvatarStyle.AVATAAARS, label: "Avataaars" },
  { value: AssistantAvatarStyle.OPEN_PEEPS, label: "Open Peeps" },
  { value: AssistantAvatarStyle.ADVENTURER, label: "Adventurer" },
  { value: AssistantAvatarStyle.BIG_SMILE, label: "Big Smile" },
  { value: AssistantAvatarStyle.BOTTTS, label: "Bottts" },
  { value: AssistantAvatarStyle.CROODLES, label: "Croodles" },
  { value: AssistantAvatarStyle.DYLAN, label: "Dylan" },
  { value: AssistantAvatarStyle.FUN_EMOJI, label: "Fun Emoji" },
  { value: AssistantAvatarStyle.MINIAVS, label: "Miniavs" },
  { value: AssistantAvatarStyle.PIXEL_ART, label: "Pixel Art" },
  { value: AssistantAvatarStyle.THUMBS, label: "Thumbs" },
];
