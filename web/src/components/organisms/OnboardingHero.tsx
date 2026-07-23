"use client";

import { motion, type Variants } from "motion/react";

import { BarLoader } from "@/components/atoms/BarLoader";
import { MicButton } from "@/components/atoms/MicButton";
import { VoiceOrb } from "@/components/atoms/VoiceOrb";
import type { MicState } from "@/hooks/useAgentSession";

const WELCOME_TITLE = "Bem-vindo à Moneta";
const WELCOME_SUBTITLE = "Toma um segundo pro seu assistente respirar…";

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

interface OnboardingHeroProps {
  audioElement: HTMLAudioElement | null;
  micStream: MediaStream | null;
  micState: MicState;
  isWarming: boolean;
  onMicToggle: () => void;
}

export function OnboardingHero({
  audioElement,
  micStream,
  micState,
  isWarming,
  onMicToggle,
}: OnboardingHeroProps) {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div
        variants={itemVariants}
        className="relative size-56 sm:size-72"
      >
        <VoiceOrb
          audioElement={audioElement}
          audioStream={micStream}
          voiceSensitivity={2.4}
        />
      </motion.div>

      <div className="max-w-md space-y-2 text-center">
        <motion.h1
          variants={itemVariants}
          className="text-2xl font-semibold tracking-tight"
        >
          {WELCOME_TITLE}
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-sm text-muted-foreground"
        >
          {WELCOME_SUBTITLE}
        </motion.p>
      </div>

      {isWarming ? (
        <motion.div variants={itemVariants}>
          <BarLoader />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <MicButton state={micState} onToggle={onMicToggle} />
        </motion.div>
      )}
    </motion.div>
  );
}

export default OnboardingHero;
