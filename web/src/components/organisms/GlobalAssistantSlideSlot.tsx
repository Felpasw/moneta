"use client";

import { motion } from "motion/react";

import {
  HOVER_LIFT,
  SLIDE_ITEM_VARIANTS,
  SLIDE_TRANSITION,
  TAP_PRESS,
} from "@/components/organisms/globalAssistant.constants";
import type { GlobalAssistantSlideSlotProps } from "@/components/organisms/interfaces/GlobalAssistantSlideSlot.interface";

export function GlobalAssistantSlideSlot({
  children,
  delay = 0,
}: GlobalAssistantSlideSlotProps) {
  return (
    <motion.div
      variants={SLIDE_ITEM_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={HOVER_LIFT}
      whileTap={TAP_PRESS}
      transition={{ ...SLIDE_TRANSITION, delay }}
      className="flex h-12 shrink-0 items-center justify-start overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

export default GlobalAssistantSlideSlot;
