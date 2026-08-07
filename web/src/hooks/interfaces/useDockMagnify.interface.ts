import type { MotionValue } from "motion/react";
import type { RefObject } from "react";

export interface UseDockMagnifySpring {
  readonly mass: number;
  readonly stiffness: number;
  readonly damping: number;
}

export interface UseDockMagnifyOptions {
  readonly mouseX: MotionValue<number>;
  readonly restSize?: number;
  readonly peakSize?: number;
  readonly spread?: number;
  readonly spring?: UseDockMagnifySpring;
}

export interface UseDockMagnifyResult {
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly width: MotionValue<number>;
  readonly height: MotionValue<number>;
}
