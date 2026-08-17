"use client";

import { AnimatePresence, motion } from "motion/react";

import { AITextLoading } from "@/components/atoms/AITextLoading";
import { useAgentActionState } from "@/hooks/useAgentActionState";
import { translateCaption } from "@/i18n/agentCaptions";
import type { OutputLanguage } from "@/services/interfaces/assistantProfile.interface";

interface AgentActionIndicatorProps {
  outputLanguage: OutputLanguage;
}

export function AgentActionIndicator({
  outputLanguage,
}: AgentActionIndicatorProps) {
  const caption = useAgentActionState();
  const text = caption ? translateCaption(caption, outputLanguage) : null;

  return (
    <AnimatePresence initial={false}>
      {text ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2"
        >
          <AITextLoading text={text} className="text-base" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default AgentActionIndicator;
