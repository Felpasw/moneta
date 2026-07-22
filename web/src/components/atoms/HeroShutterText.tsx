"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface HeroShutterTextProps {
  text?: string;
  href?: string;
  className?: string;
  textSizeClass?: string;
}

const DEFAULT_TEXT = "MONETA";
const DEFAULT_HREF = "/login";
const DEFAULT_TEXT_SIZE_CLASS = "text-[clamp(2.5rem,12vw,12rem)]";
const NBSP = " ";

type SliceDirection = "ltr" | "rtl";

interface SliceLayer {
  key: string;
  colorClass: string;
  clipPath: string;
  direction: SliceDirection;
  delayOffset: number;
}

const SLICE_LAYERS: SliceLayer[] = [
  {
    key: "top",
    colorClass: "text-primary",
    clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)",
    direction: "ltr",
    delayOffset: 0,
  },
  {
    key: "middle",
    colorClass: "text-foreground/80",
    clipPath: "polygon(0 35%, 100% 35%, 100% 65%, 0 65%)",
    direction: "rtl",
    delayOffset: 0.1,
  },
  {
    key: "bottom",
    colorClass: "text-primary",
    clipPath: "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
    direction: "ltr",
    delayOffset: 0.2,
  },
];

const DIRECTION_MAP: Record<
  SliceDirection,
  { initialX: string; animateX: string }
> = {
  ltr: { initialX: "-100%", animateX: "100%" },
  rtl: { initialX: "100%", animateX: "-100%" },
};

const TEXT_STYLE_BASE = "inline-block leading-none font-black tracking-tighter";

function renderChar(char: string): string {
  if (char === " ") return NBSP;
  return char;
}

export function HeroShutterText({
  text = DEFAULT_TEXT,
  href = DEFAULT_HREF,
  className,
  textSizeClass = DEFAULT_TEXT_SIZE_CLASS,
}: HeroShutterTextProps) {
  const characters = text.split("");
  const textClasses = cn(TEXT_STYLE_BASE, textSizeClass);

  return (
    <Link
      href={href}
      aria-label={text}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {characters.map((char, index) => (
        <span
          key={`${char}-${index}`}
          aria-hidden="true"
          className="relative inline-block overflow-hidden px-[1px]"
        >
          <motion.span
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: index * 0.04 + 0.3, duration: 0.8 }}
            className={cn(textClasses, "text-foreground")}
          >
            {renderChar(char)}
          </motion.span>

          {SLICE_LAYERS.map((layer) => {
            const { initialX, animateX } = DIRECTION_MAP[layer.direction];
            return (
              <motion.span
                key={layer.key}
                initial={{ x: initialX, opacity: 0 }}
                animate={{ x: animateX, opacity: [0, 1, 0] }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.04 + layer.delayOffset,
                  ease: "easeInOut",
                }}
                style={{ clipPath: layer.clipPath }}
                className={cn(
                  "pointer-events-none absolute inset-0",
                  textClasses,
                  layer.colorClass,
                )}
              >
                {renderChar(char)}
              </motion.span>
            );
          })}
        </span>
      ))}
    </Link>
  );
}

export default HeroShutterText;
