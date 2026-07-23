"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface CircuitBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
  opacity?: number;
}

export function CircuitBackground({
  children,
  className,
  animated = true,
  opacity = 0.15,
  ...props
}: CircuitBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <svg
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full",
          animated && "animate-circuit",
        )}
        style={{ opacity }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="circuit-pattern"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 50 H30 M70 50 H100"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-primary"
            />
            <path
              d="M50 0 V30 M50 70 V100"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-primary"
            />
            <circle
              cx="50"
              cy="50"
              r="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-primary"
            />
            <circle cx="0" cy="0" r="2" fill="currentColor" className="text-primary" />
            <circle cx="100" cy="0" r="2" fill="currentColor" className="text-primary" />
            <circle cx="0" cy="100" r="2" fill="currentColor" className="text-primary" />
            <circle cx="100" cy="100" r="2" fill="currentColor" className="text-primary" />
            <path
              d="M30 50 L50 30 M50 70 L70 50"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              className="text-primary"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

export default CircuitBackground;
