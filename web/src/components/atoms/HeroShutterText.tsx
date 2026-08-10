"use client";

import Link from "next/link";

import { ShutterText } from "@/components/atoms/ShutterText";
import { cn } from "@/lib/utils";

interface HeroShutterTextProps {
  text?: string;
  href?: string;
  className?: string;
  textSizeClass?: string;
}

const DEFAULT_TEXT = "MONETA";
const DEFAULT_HREF = "/login";

export function HeroShutterText({
  text = DEFAULT_TEXT,
  href = DEFAULT_HREF,
  className,
  textSizeClass,
}: HeroShutterTextProps) {
  return (
    <Link
      href={href}
      aria-label={text}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <ShutterText text={text} textSizeClass={textSizeClass} />
    </Link>
  );
}

export default HeroShutterText;
