import type { AssistantAvatarSize } from "@/components/atoms/AssistantAvatar";

export interface TalkingAssistantAvatarProps {
  avatarUrl: string | null;
  audioElement: HTMLAudioElement | null;
  fallbackSeed?: string;
  size?: AssistantAvatarSize;
  className?: string;
  sensitivity?: number;
  speakingThreshold?: number;
}
