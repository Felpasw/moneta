import { AssistantAvatarStyle } from "@/components/atoms/AssistantAvatar";
import type { TreatmentStyle } from "@/services/interfaces/assistantProfile.interface";

export interface TreatmentStyleOption {
  value: TreatmentStyle;
  label: string;
  example: string;
}

export const TREATMENT_STYLE_OPTIONS: readonly TreatmentStyleOption[] = [
  {
    value: "formal",
    label: "Formal",
    example: "Good morning, Felipe. How may I assist you with your finances today?",
  },
  {
    value: "informal",
    label: "Informal",
    example: "Hey Felipe! How can I help you today?",
  },
  {
    value: "very_informal",
    label: "Very informal",
    example: "Yo dude, all good? Let's take a look at your cash?",
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
