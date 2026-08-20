"use client";

import type { RippleLoaderProps } from "@/components/atoms/interfaces/RippleLoader.interface";
import { cn } from "@/lib/utils";

const CELL_DELAYS_MS: readonly number[] = [
  0, 100, 200, 100, 200, 200, 300, 300, 400,
];

const DEFAULT_LABEL = "Loading";

export function RippleLoader({
  className,
  label = DEFAULT_LABEL,
}: RippleLoaderProps) {
  return (
    <div
      role="status"
      aria-label={label}
      data-slot="ripple-loader"
      className={cn(
        "grid grid-cols-3 gap-[1px] w-[calc(3*(52px+2px))] h-[calc(3*(52px+2px))] text-foreground",
        className,
      )}
    >
      {CELL_DELAYS_MS.map((delayMs, index) => (
        <div
          key={index}
          data-slot="ripple-loader-cell"
          className="size-[52px] rounded-[4px] animate-ripple-cell"
          style={{ animationDelay: `${delayMs}ms` }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default RippleLoader;
