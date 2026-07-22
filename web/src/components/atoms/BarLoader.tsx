"use client";

import { cn } from "@/lib/utils";

interface BarLoaderProps {
  bars?: number;
  barWidth?: number;
  barHeight?: number;
  colorClass?: string;
  speed?: number;
  className?: string;
  label?: string;
}

const DEFAULT_BARS = 8;
const DEFAULT_BAR_WIDTH = 6;
const DEFAULT_BAR_HEIGHT = 32;
const DEFAULT_SPEED_SECONDS = 1.2;
const DEFAULT_COLOR = "bg-foreground";
const DEFAULT_LABEL = "Conectando…";
const BAR_DELAY_STEP_SECONDS = 0.1;

export function BarLoader({
  bars = DEFAULT_BARS,
  barWidth = DEFAULT_BAR_WIDTH,
  barHeight = DEFAULT_BAR_HEIGHT,
  colorClass = DEFAULT_COLOR,
  speed = DEFAULT_SPEED_SECONDS,
  className,
  label = DEFAULT_LABEL,
}: BarLoaderProps) {
  const barsArray = Array.from({ length: bars });

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "relative flex items-end justify-center gap-1",
        className,
      )}
    >
      {barsArray.map((_, i) => (
        <div
          key={i}
          data-slot="bar-loader-bar"
          className={cn(colorClass, "origin-bottom rounded-t-xl animate-bar-loader")}
          style={{
            width: `${barWidth}px`,
            height: `${barHeight}px`,
            animationDelay: `${(i + 1) * BAR_DELAY_STEP_SECONDS}s`,
            animationDuration: `${speed}s`,
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default BarLoader;
