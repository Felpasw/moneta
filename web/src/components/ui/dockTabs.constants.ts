import type { Variants } from "motion/react";

export const GLASS_FILTER_ID = "dock-glass-distortion";

export const GLASS_OUTER_SHADOW =
  "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)";

export const GLASS_INSET_SHADOW =
  "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)";

export const ICON_LIFT_TRANSITION = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

export const TOOLTIP_TRANSITION = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
};

export const ICON_LIFT_VARIANTS: Variants = {
  rest: { y: 0 },
  hover: { y: -8 },
  tap: { y: 2, scale: 0.95 },
};

export const INNER_ICON_VARIANTS: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.1 },
};

export const OVERLAY_VARIANTS: Variants = {
  rest: { opacity: 0.1 },
  hover: { opacity: 0.3 },
};

export const TOOLTIP_VARIANTS: Variants = {
  rest: { opacity: 0, y: 10, scale: 0.8 },
  hover: { opacity: 1, y: -20, scale: 1 },
};

export const DOT_VARIANTS: Variants = {
  rest: { scale: 1 },
  tap: { scale: 1.5 },
};
