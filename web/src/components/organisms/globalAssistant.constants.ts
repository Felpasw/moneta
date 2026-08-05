import type { Variants } from "motion/react";

export const FALLBACK_SEED = "user";
export const HIDDEN_ROUTES: ReadonlySet<string> = new Set<string>();
export const MESSAGE_SOON_TOAST =
  "Chat with the assistant is coming, hang tight.";

export const SLIDE_TRANSITION = {
  type: "spring" as const,
  bounce: 0,
  duration: 0.55,
};

export const HOVER_TRANSITION = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

export const HOVER_LIFT = { y: -6 } as const;
export const TAP_PRESS = { y: 2, scale: 0.95 } as const;

export const SLIDE_ITEM_VARIANTS: Variants = {
  initial: { width: 0, opacity: 0, x: -12 },
  animate: { width: 48, opacity: 1, x: 0 },
  exit: { width: 0, opacity: 0, x: -12 },
};
