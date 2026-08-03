import {
  ASSISTANT_AVATAR_STYLES,
  type AssistantAvatarStyle,
} from "@/components/atoms/AssistantAvatar";

export interface ParsedAvatarUrl {
  style: AssistantAvatarStyle | null;
  seed: string | null;
}

const AVATAR_URL_PATTERN =
  /^dicebear:([a-z0-9]+(?:-[a-z0-9]+)*):([A-Za-z0-9_-]{1,128})$/;

export const parseAvatarUrl = (avatarUrl: string | null): ParsedAvatarUrl => {
  if (!avatarUrl) return { style: null, seed: null };

  const match = AVATAR_URL_PATTERN.exec(avatarUrl);
  if (!match) return { style: null, seed: null };

  const [, styleRaw, seed] = match;
  if (!(ASSISTANT_AVATAR_STYLES as readonly string[]).includes(styleRaw)) {
    return { style: null, seed: null };
  }

  return { style: styleRaw as AssistantAvatarStyle, seed };
};

export const composeAvatarUrl = (
  style: AssistantAvatarStyle,
  seed: string,
): string => `dicebear:${style}:${seed}`;
