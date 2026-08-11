"use client";

import { useSpring, useTransform } from "motion/react";
import { useRef } from "react";

import type {
  UseDockMagnifyOptions,
  UseDockMagnifyResult,
  UseDockMagnifySpring,
} from "@/hooks/interfaces/useDockMagnify.interface";

const DEFAULT_REST_SIZE = 50;
const DEFAULT_PEAK_SIZE = 80;
const DEFAULT_SPREAD = 150;
const DEFAULT_SPRING: UseDockMagnifySpring = {
  mass: 0.1,
  stiffness: 150,
  damping: 12,
};
const EMPTY_BOUNDS = { x: 0, width: 0 } as const;

export function useDockMagnify({
  mouseX,
  restSize = DEFAULT_REST_SIZE,
  peakSize = DEFAULT_PEAK_SIZE,
  spread = DEFAULT_SPREAD,
  spring = DEFAULT_SPRING,
}: UseDockMagnifyOptions): UseDockMagnifyResult {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? EMPTY_BOUNDS;
    return val - bounds.x - bounds.width / 2;
  });
  const widthSync = useTransform(
    distance,
    [-spread, 0, spread],
    [restSize, peakSize, restSize],
  );
  const heightSync = useTransform(
    distance,
    [-spread, 0, spread],
    [restSize, peakSize, restSize],
  );
  const width = useSpring(widthSync, spring);
  const height = useSpring(heightSync, spring);
  return { ref, width, height };
}
