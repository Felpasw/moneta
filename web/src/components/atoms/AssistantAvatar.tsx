"use client";

import { createAvatar } from "@dicebear/core";
import {
  adventurer,
  avataaars,
  bigSmile,
  bottts,
  croodles,
  dylan,
  funEmoji,
  lorelei,
  micah,
  miniavs,
  notionists,
  openPeeps,
  personas,
  pixelArt,
  thumbs,
} from "@dicebear/collection";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

export enum AssistantAvatarStyle {
  NOTIONISTS = "notionists",
  PERSONAS = "personas",
  LORELEI = "lorelei",
  MICAH = "micah",
  AVATAAARS = "avataaars",
  OPEN_PEEPS = "open-peeps",
  ADVENTURER = "adventurer",
  BIG_SMILE = "big-smile",
  BOTTTS = "bottts",
  CROODLES = "croodles",
  DYLAN = "dylan",
  FUN_EMOJI = "fun-emoji",
  MINIAVS = "miniavs",
  PIXEL_ART = "pixel-art",
  THUMBS = "thumbs",
}

export type AssistantAvatarState = "idle" | "thinking" | "speaking";

export type AssistantAvatarSize = "sm" | "md" | "lg";

interface AssistantAvatarProps {
  avatarUrl: string | null;
  state?: AssistantAvatarState;
  size?: AssistantAvatarSize;
  fallbackSeed?: string;
  className?: string;
}

export const ASSISTANT_AVATAR_STYLES: readonly AssistantAvatarStyle[] =
  Object.values(AssistantAvatarStyle);

const FALLBACK_STYLE: AssistantAvatarStyle = AssistantAvatarStyle.NOTIONISTS;
const DEFAULT_FALLBACK_SEED = "user";
const AVATAR_URL_PATTERN = /^dicebear:([a-z0-9]+(?:-[a-z0-9]+)*):([A-Za-z0-9_-]{1,128})$/;

const STYLE_MODULES: Record<AssistantAvatarStyle, unknown> = {
  [AssistantAvatarStyle.NOTIONISTS]: notionists,
  [AssistantAvatarStyle.PERSONAS]: personas,
  [AssistantAvatarStyle.LORELEI]: lorelei,
  [AssistantAvatarStyle.MICAH]: micah,
  [AssistantAvatarStyle.AVATAAARS]: avataaars,
  [AssistantAvatarStyle.OPEN_PEEPS]: openPeeps,
  [AssistantAvatarStyle.ADVENTURER]: adventurer,
  [AssistantAvatarStyle.BIG_SMILE]: bigSmile,
  [AssistantAvatarStyle.BOTTTS]: bottts,
  [AssistantAvatarStyle.CROODLES]: croodles,
  [AssistantAvatarStyle.DYLAN]: dylan,
  [AssistantAvatarStyle.FUN_EMOJI]: funEmoji,
  [AssistantAvatarStyle.MINIAVS]: miniavs,
  [AssistantAvatarStyle.PIXEL_ART]: pixelArt,
  [AssistantAvatarStyle.THUMBS]: thumbs,
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
    const styleModule = STYLE_MODULES[style] as Parameters<typeof createAvatar>[0];
    return createAvatar(styleModule, { seed }).toDataUri();
  }, [style, seed]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG inline via data URI, sem otimização remota aplicável
    <img
      src={dataUri}
      alt={`Avatar do assistente (${style})`}
      className={cn(
        "rounded-full object-cover",
        SIZE_CLASSES[size],
        STATE_CLASSES[state],
        className,
      )}
    />
  );
}

export default AssistantAvatar;
