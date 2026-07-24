"use client";

import { motion, type Variants } from "motion/react";

import { BarLoader } from "@/components/atoms/BarLoader";
import { MicButton } from "@/components/atoms/MicButton";
import { StepIndicator } from "@/components/atoms/StepIndicator";
import { VoiceOrb } from "@/components/atoms/VoiceOrb";
import type { MicState } from "@/hooks/useAgentSession";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEP_LABELS } from "@/utils/onboardingProgress";

const WELCOME_TITLE = "Bem-vindo à Moneta";
const WELCOME_SUBTITLE = "Toma um segundo pro seu assistente respirar…";

const LAYOUT_TRANSITION = {
  layout: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

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
  activeStep?: number;
  compact?: boolean;
}

export function OnboardingHero({
  audioElement,
  micStream,
  micState,
  isWarming,
  onMicToggle,
  activeStep,
  compact = false,
}: OnboardingHeroProps) {
  return (
    <motion.div
      layout
      className={cn(
        "flex flex-col items-center justify-center px-6",
        compact ? "gap-4 pt-6 pb-16" : "flex-1 gap-10 py-16",
      )}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      transition={LAYOUT_TRANSITION}
    >
      <motion.div
        layout
        variants={itemVariants}
        className={cn(
          "relative",
          compact ? "size-40 sm:size-48" : "size-56 sm:size-72",
        )}
        transition={LAYOUT_TRANSITION}
      >
        <VoiceOrb
          audioElement={audioElement}
          audioStream={micStream}
          voiceSensitivity={2.4}
        />
      </motion.div>

      {!compact && (
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
      )}

      {isWarming ? (
        <motion.div variants={itemVariants}>
          <BarLoader />
        </motion.div>
      ) : (
        <motion.div
          layout
          variants={itemVariants}
          className={cn(
            "flex flex-col items-center",
            compact ? "gap-4" : "gap-8",
          )}
          transition={LAYOUT_TRANSITION}
        >
          <MicButton state={micState} onToggle={onMicToggle} />
          {activeStep !== undefined && (
            <StepIndicator
              steps={ONBOARDING_STEP_LABELS as unknown as string[]}
              activeIndex={activeStep}
            />
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default OnboardingHero;
