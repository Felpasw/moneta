"use client";

import { motion, type Variants } from "motion/react";

import { BarLoader } from "@/components/atoms/BarLoader";
import { VoiceOrb } from "@/components/atoms/VoiceOrb";
import { useAgentSession } from "@/hooks/useAgentSession";

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

export function OnboardingHero() {
  const { audioElement, isWarming } = useAgentSession({ enabled: true });

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
        <VoiceOrb audioElement={audioElement} voiceSensitivity={2.4} />
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
      ) : null}
    </motion.div>
  );
}

export default OnboardingHero;
