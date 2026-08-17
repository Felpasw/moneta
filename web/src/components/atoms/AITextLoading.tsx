"use client";

import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

interface AITextLoadingProps {
  text: string;
  className?: string;
}

export function AITextLoading({ text, className }: AITextLoadingProps) {
  return (
    <div className="flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            backgroundPosition: ["200% center", "-200% center"],
          }}
          exit={{ opacity: 0, y: -12 }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 0.3 },
            backgroundPosition: {
              duration: 2.5,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
            },
          }}
          className={cn(
            "flex min-w-max whitespace-nowrap bg-[length:200%_100%] bg-gradient-to-r from-neutral-950 via-neutral-400 to-neutral-950 bg-clip-text font-semibold text-transparent dark:from-white dark:via-neutral-600 dark:to-white",
            className,
          )}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default AITextLoading;
