"use client";

import { Eye, EyeOff } from "lucide-react";
import { motion, type Variants } from "motion/react";
import { useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
  showPasswordToggle?: boolean;
}

const TOGGLE_SHOW_LABEL = "Mostrar senha";
const TOGGLE_HIDE_LABEL = "Esconder senha";

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const letterVariants: Variants = {
  initial: {
    y: 0,
    color: "inherit",
  },
  animate: {
    y: "-120%",
    color: "var(--color-zinc-500)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

export function AnimatedInput({
  label,
  className,
  value,
  type = "text",
  onFocus,
  onBlur,
  showPasswordToggle = false,
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const showLabel = isFocused || value.length > 0;
  const animationState = showLabel ? "animate" : "initial";

  const isPasswordField = type === "password";
  const toggleEnabled = showPasswordToggle && isPasswordField;
  const effectiveType = toggleEnabled && isRevealed ? "text" : type;
  const toggleLabel = isRevealed ? TOGGLE_HIDE_LABEL : TOGGLE_SHOW_LABEL;
  const ToggleIcon = isRevealed ? EyeOff : Eye;

  return (
    <div className={cn("relative", className)}>
      <motion.div
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none text-zinc-900 dark:text-zinc-50"
        variants={containerVariants}
        initial="initial"
        animate={animationState}
      >
        {label.split("").map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            className="inline-block text-sm"
            variants={letterVariants}
            style={{ willChange: "transform" }}
          >
            {char === " " ? " " : char}
          </motion.span>
        ))}
      </motion.div>

      <input
        {...props}
        aria-label={props["aria-label"] ?? label}
        value={value}
        type={effectiveType}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        className={cn(
          "outline-none border-b-2 border-zinc-900 dark:border-zinc-50 py-2 w-full text-base font-medium text-zinc-900 dark:text-zinc-50 bg-transparent placeholder-transparent",
          toggleEnabled && "pr-8",
        )}
      />

      {toggleEnabled ? (
        <button
          type="button"
          aria-label={toggleLabel}
          onClick={() => setIsRevealed((prev) => !prev)}
          tabIndex={-1}
          className="absolute bottom-2 right-0 flex h-6 w-6 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:text-zinc-900 focus-visible:outline-none dark:hover:text-zinc-50 dark:focus-visible:text-zinc-50"
        >
          <ToggleIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export default AnimatedInput;
