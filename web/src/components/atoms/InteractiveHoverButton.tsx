"use client";

import { ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";

import { cn } from "@/lib/utils";

export type InteractiveHoverButtonStatus = "idle" | "loading" | "success";

interface InteractiveHoverButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  text?: string;
  loadingText?: string;
  successText?: string;
  status?: InteractiveHoverButtonStatus;
  classes?: string;
}

const STATE_CONTENT: Record<
  InteractiveHoverButtonStatus,
  (labels: { text: string; loadingText: string; successText: string }) => React.ReactNode
> = {
  idle: ({ text }) => (
    <>
      <span>{text}</span>
      <ArrowRight className="h-4 w-4" />
    </>
  ),
  loading: ({ loadingText }) => (
    <>
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
      <span>{loadingText}</span>
    </>
  ),
  success: ({ successText }) => (
    <>
      <Check className="h-4 w-4" />
      <span>{successText}</span>
    </>
  ),
};

export function InteractiveHoverButton({
  text = "Button",
  loadingText = "Processing...",
  successText = "Complete!",
  status = "idle",
  classes,
  className,
  disabled,
  ...props
}: InteractiveHoverButtonProps) {
  const isIdle = status === "idle";
  const isDisabled = disabled || !isIdle;

  return (
    <motion.button
      {...props}
      disabled={isDisabled}
      className={cn(
        "group relative flex min-w-40 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-background p-2 px-6 font-semibold",
        "disabled:cursor-not-allowed",
        !isIdle && "px-2",
        classes,
        className,
      )}
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key="idle"
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div
            aria-hidden="true"
            className={cn(
              "h-2 w-2 rounded-full bg-primary transition-all duration-500 group-hover:scale-[40]",
              !isIdle && "scale-[40]",
            )}
          />
          <span
            aria-hidden={!isIdle}
            className={cn(
              "inline-block transition-all duration-500 group-hover:translate-x-20 group-hover:opacity-0",
              !isIdle && "translate-x-20 opacity-0",
            )}
          >
            {text}
          </span>
          <div
            className={cn(
              "absolute top-0 left-0 z-10 flex h-full w-full -translate-x-16 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100",
              !isIdle && "translate-x-0 opacity-100",
            )}
          >
            {STATE_CONTENT[status]({ text, loadingText, successText })}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

export default InteractiveHoverButton;
