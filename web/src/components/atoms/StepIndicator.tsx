"use client";

import { motion, type Variants } from "motion/react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type StepState = "past" | "current" | "future";

interface StepIndicatorProps {
  steps: readonly string[];
  activeIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

const nodeVariants: Variants = {
  past: {
    scale: 1,
    backgroundColor: "var(--color-primary)",
    color: "var(--color-primary-foreground)",
    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
  },
  current: {
    scale: 1.08,
    backgroundColor: "var(--color-foreground)",
    color: "var(--color-background)",
    boxShadow: "0 0 24px -6px var(--color-primary)",
  },
  future: {
    scale: 1,
    backgroundColor: "var(--color-muted)",
    color: "var(--color-muted-foreground)",
    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
  },
};

const labelVariants: Variants = {
  past: { opacity: 0.6 },
  current: { opacity: 1 },
  future: { opacity: 0.45 },
};

const stateFor = (index: number, activeIndex: number): StepState => {
  if (index < activeIndex) return "past";
  if (index === activeIndex) return "current";
  return "future";
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

export function StepIndicator({
  steps,
  activeIndex,
  onStepClick,
  className,
}: StepIndicatorProps) {
  const clampedIndex = clamp(activeIndex, 0, steps.length);
  const progress = steps.length === 0 ? 0 : (clampedIndex / (steps.length - 1)) * 100;

  return (
    <div className={cn("w-full max-w-md", className)}>
      <ol
        className="flex items-center justify-between gap-2"
        aria-label="Progresso do onboarding"
      >
        {steps.map((label, index) => {
          const state = stateFor(index, clampedIndex);
          const canJump = onStepClick !== undefined && state === "past";
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className="flex flex-1 items-center gap-2"
              aria-current={state === "current" ? "step" : undefined}
            >
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  type="button"
                  onClick={canJump ? () => onStepClick(index) : undefined}
                  disabled={!canJump}
                  variants={nodeVariants}
                  animate={state}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium tabular-nums",
                    "disabled:cursor-default",
                    canJump && "cursor-pointer hover:opacity-90",
                  )}
                  aria-label={`Etapa ${index + 1}: ${label}`}
                >
                  {state === "past" ? (
                    <Check className="h-4 w-4" strokeWidth={2.75} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  {state === "current" && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-full"
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: [0.4, 0.15, 0.4] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ background: "var(--color-primary)", filter: "blur(10px)" }}
                    />
                  )}
                </motion.button>
                <motion.span
                  variants={labelVariants}
                  animate={state}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="max-w-[6.5rem] text-center text-[11px] leading-tight text-muted-foreground"
                >
                  {label}
                </motion.span>
              </div>
              {!isLast && (
                <div className="relative -mt-6 h-[2px] flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="absolute inset-y-0 left-0 origin-left rounded-full bg-primary"
                    initial={false}
                    animate={{ scaleX: index < clampedIndex ? 1 : 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 h-[2px] overflow-hidden rounded-full bg-muted/70">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default StepIndicator;
