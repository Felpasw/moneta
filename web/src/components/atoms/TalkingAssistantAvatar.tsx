"use client";

import { motion } from "motion/react";

import { AssistantAvatar } from "@/components/atoms/AssistantAvatar";
import type { TalkingAssistantAvatarProps } from "@/components/atoms/interfaces/TalkingAssistantAvatar.interface";
import { useAudioAmplitude } from "@/hooks/useAudioAmplitude";
import { cn } from "@/lib/utils";

const DEFAULT_SENSITIVITY = 3;
const DEFAULT_SPEAKING_THRESHOLD = 0.04;

export function TalkingAssistantAvatar({
  avatarUrl,
  audioElement,
  fallbackSeed,
  size = "lg",
  className,
  sensitivity = DEFAULT_SENSITIVITY,
  speakingThreshold = DEFAULT_SPEAKING_THRESHOLD,
}: TalkingAssistantAvatarProps) {
  const { scale, bob, isSpeaking } = useAudioAmplitude(audioElement, {
    sensitivity,
    speakingThreshold,
  });

  return (
    <motion.div
      style={{ scale, y: bob }}
      className={cn(
        "inline-flex origin-bottom items-center justify-center",
        className,
      )}
    >
      <AssistantAvatar
        avatarUrl={avatarUrl}
        state={isSpeaking ? "speaking" : "idle"}
        size={size}
        fallbackSeed={fallbackSeed}
      />
    </motion.div>
  );
}

export default TalkingAssistantAvatar;
