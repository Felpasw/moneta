"use client";

import { motion } from "motion/react";

import {
  AssistantAvatar,
  type AssistantAvatarStyle,
} from "@/components/atoms/AssistantAvatar";
import { cn } from "@/lib/utils";
import { composeAvatarUrl, parseAvatarUrl } from "@/utils/dicebearAvatarUrl";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

import { CURATED_AVATAR_STYLE_OPTIONS } from "./assistantSettings.constants";

const AVATAR_SEED = "cuzi";

interface AssistantSettingsAvatarProps {
  avatarUrl: string | null;
  defaultSeed: string;
  onChange: (avatarUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AssistantSettingsAvatar({
  avatarUrl,
  onChange,
  disabled,
  className,
}: AssistantSettingsAvatarProps) {
  const parsed = parseAvatarUrl(avatarUrl);

  const handleStyleClick = (style: AssistantAvatarStyle) => {
    if (disabled) return;
    onChange(composeAvatarUrl(style, AVATAR_SEED));
  };

  return (
    <section
      aria-labelledby="assistant-avatar-heading"
      className={cn("space-y-4", className)}
    >
      <motion.header variants={SETTINGS_STAGGER_ITEM} className="space-y-1">
        <h2
          id="assistant-avatar-heading"
          className="text-lg font-heading font-medium"
        >
          Avatar
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick the style you want for your assistant.
        </p>
      </motion.header>

      <motion.div
        variants={SETTINGS_STAGGER_ITEM}
        role="radiogroup"
        aria-labelledby="assistant-avatar-heading"
        className="grid grid-cols-3 gap-3 sm:grid-cols-5"
      >
        {CURATED_AVATAR_STYLE_OPTIONS.map((option) => {
          const isSelected = parsed.style === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStyleClick(option.value)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`Choose ${option.label} style`}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border border-border p-3 transition-colors",
                "hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50",
                isSelected && "border-primary bg-primary/5",
              )}
            >
              <AssistantAvatar
                avatarUrl={composeAvatarUrl(option.value, AVATAR_SEED)}
                size="md"
              />
              <span className="text-xs text-muted-foreground">
                {option.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </section>
  );
}

export default AssistantSettingsAvatar;
