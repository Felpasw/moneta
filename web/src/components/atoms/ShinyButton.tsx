"use client";

import type {
  ShinyButtonProps,
  ShinyButtonVariant,
} from "@/components/atoms/interfaces/ShinyButton.interface";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES: Record<ShinyButtonVariant, string> = {
  default:
    "border-white/10 hover:border-white/30 bg-gradient-to-tr from-black/60 to-black/40 hover:from-white/10 hover:to-black/40 hover:shadow-white/20",
  green:
    "border-green-500/20 hover:border-green-500/50 bg-gradient-to-tr from-black/60 to-black/40 hover:from-green-500/10 hover:to-black/40 hover:shadow-green-500/30",
  indigo:
    "border-indigo-500/20 hover:border-indigo-500/50 bg-gradient-to-tr from-black/60 to-black/40 hover:from-indigo-500/10 hover:to-black/40 hover:shadow-indigo-500/30",
  red: "border-red-500/20 hover:border-red-500/50 bg-gradient-to-tr from-black/60 to-black/40 hover:from-red-500/10 hover:to-black/40 hover:shadow-red-500/30",
};

const GLOW_CLASSES: Record<ShinyButtonVariant, string> = {
  default: "via-white/10",
  green: "via-green-400/20",
  indigo: "via-indigo-400/20",
  red: "via-red-400/20",
};

const BASE_CLASSES =
  "group relative overflow-hidden cursor-pointer rounded-full border p-5 backdrop-blur-lg shadow-lg transition-all duration-300 ease-out hover:scale-110 hover:rotate-2 hover:shadow-2xl active:scale-95 active:rotate-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:rotate-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const GLOW_BASE_CLASSES =
  "pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full";

export function ShinyButton({
  icon,
  ariaLabel,
  variant = "default",
  onClick,
  onMouseDown,
  disabled = false,
  className,
}: ShinyButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={disabled}
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)}
    >
      <span aria-hidden className={cn(GLOW_BASE_CLASSES, GLOW_CLASSES[variant])} />
      <span className="relative z-10 flex items-center justify-center">{icon}</span>
    </button>
  );
}

export default ShinyButton;
