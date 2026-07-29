"use client";

import { Avatar } from "@dicebear/core";
import {
  avataaars,
  lorelei,
  micah,
  notionists,
  openPeeps,
  personas,
} from "@dicebear/collection";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

export type AssistantAvatarStyle =
  | "notionists"
  | "personas"
  | "lorelei"
  | "micah"
  | "avataaars"
  | "open-peeps";

export type AssistantAvatarState = "idle" | "thinking" | "speaking";

export type AssistantAvatarSize = "sm" | "md" | "lg";

interface AssistantAvatarProps {
  avatarUrl: string | null;
  state?: AssistantAvatarState;
  size?: AssistantAvatarSize;
  fallbackSeed?: string;
  className?: string;
}

export const ASSISTANT_AVATAR_STYLES: readonly AssistantAvatarStyle[] = [
  "notionists",
  "personas",
  "lorelei",
  "micah",
  "avataaars",
  "open-peeps",
];

const FALLBACK_STYLE: AssistantAvatarStyle = "notionists";
const DEFAULT_FALLBACK_SEED = "user";
const AVATAR_URL_PATTERN = /^dicebear:([a-z0-9]+(?:-[a-z0-9]+)*):([A-Za-z0-9_-]{1,128})$/;

const STYLE_MODULES: Record<AssistantAvatarStyle, unknown> = {
  notionists,
  personas,
  lorelei,
  micah,
  avataaars,
  "open-peeps": openPeeps,
};

const STATE_CLASSES: Record<AssistantAvatarState, string> = {
  idle: "",
  thinking: "opacity-70 animate-pulse [animation-duration:2.5s]",
  speaking: "animate-pulse ring-2 ring-primary/40",
};

const SIZE_CLASSES: Record<AssistantAvatarSize, string> = {
  sm: "h-8 w-8",
  md: "h-16 w-16",
  lg: "h-32 w-32",
};

const isCuratedStyle = (value: string): value is AssistantAvatarStyle =>
  (ASSISTANT_AVATAR_STYLES as readonly string[]).includes(value);

interface ParsedAvatarUrl {
  style: AssistantAvatarStyle;
  seed: string;
}

const parseAvatarUrl = (
  avatarUrl: string | null,
  fallbackSeed: string,
): ParsedAvatarUrl => {
  if (!avatarUrl) return { style: FALLBACK_STYLE, seed: fallbackSeed };

  const match = AVATAR_URL_PATTERN.exec(avatarUrl);
  if (!match) return { style: FALLBACK_STYLE, seed: fallbackSeed };

  const [, style, seed] = match;
  if (!isCuratedStyle(style)) {
    return { style: FALLBACK_STYLE, seed: fallbackSeed };
  }

  return { style, seed };
};

export function AssistantAvatar({
  avatarUrl,
  state = "idle",
  size = "md",
  fallbackSeed = DEFAULT_FALLBACK_SEED,
  className,
}: AssistantAvatarProps) {
  const { style, seed } = parseAvatarUrl(avatarUrl, fallbackSeed);

  const dataUri = useMemo(() => {
    const styleModule = STYLE_MODULES[style];
    return new Avatar(styleModule, { seed }).toDataUri();
  }, [style, seed]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG inline via data URI, sem otimização remota aplicável
    <img
      src={dataUri}
      alt={`Avatar do assistente (${style})`}
      className={cn(
        "rounded-full bg-muted object-cover",
        SIZE_CLASSES[size],
        STATE_CLASSES[state],
        className,
      )}
    />
  );
}

export default AssistantAvatar;
