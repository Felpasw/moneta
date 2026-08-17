"use client";

import { motion, type TargetAndTransition, type Transition } from "motion/react";

import { AssistantAvatar } from "@/components/atoms/AssistantAvatar";
import type { TalkingAssistantAvatarProps } from "@/components/atoms/interfaces/TalkingAssistantAvatar.interface";
import { useAudioAmplitude } from "@/hooks/useAudioAmplitude";
import { cn } from "@/lib/utils";

const DEFAULT_SENSITIVITY = 3;
const DEFAULT_SPEAKING_THRESHOLD = 0.04;
const INTERRUPT_KEYFRAMES: TargetAndTransition = {
  scale: [1, 1.14, 0.96, 1],
};
const INTERRUPT_TRANSITION: Transition = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1],
};

export function TalkingAssistantAvatar({
  avatarUrl,
  audioElement,
  fallbackSeed,
  size = "lg",
  className,
  sensitivity = DEFAULT_SENSITIVITY,
  speakingThreshold = DEFAULT_SPEAKING_THRESHOLD,
  interruptSignal = 0,
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
      <motion.div
        key={interruptSignal}
        data-pulse-key={interruptSignal}
        animate={interruptSignal > 0 ? INTERRUPT_KEYFRAMES : undefined}
        transition={INTERRUPT_TRANSITION}
        className="inline-flex"
      >
        <AssistantAvatar
          avatarUrl={avatarUrl}
          state={isSpeaking ? "speaking" : "idle"}
          size={size}
          fallbackSeed={fallbackSeed}
        />
      </motion.div>
    </motion.div>
  );
}

export default TalkingAssistantAvatar;
