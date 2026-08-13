"use client";

import { AnimatePresence, motion } from "motion/react";

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
          key={text}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md"
        >
          {text}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default AgentActionIndicator;
