"use client";

import { useState } from "react";

import { AnimatedInput } from "@/components/atoms/AnimatedInput";
import {
  AssistantAvatar,
  type AssistantAvatarStyle,
} from "@/components/atoms/AssistantAvatar";
import { cn } from "@/lib/utils";
import { composeAvatarUrl, parseAvatarUrl } from "@/utils/dicebearAvatarUrl";

import { CURATED_AVATAR_STYLE_OPTIONS } from "./assistantSettings.constants";

interface AssistantSettingsAvatarProps {
  avatarUrl: string | null;
  defaultSeed: string;
  onChange: (avatarUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AssistantSettingsAvatar({
  avatarUrl,
  defaultSeed,
  onChange,
  disabled,
  className,
}: AssistantSettingsAvatarProps) {
  const parsed = parseAvatarUrl(avatarUrl);
  const [seed, setSeed] = useState<string>(parsed.seed ?? defaultSeed);

  const handleStyleClick = (style: AssistantAvatarStyle) => {
    if (disabled) return;
    if (seed.length === 0) return;
    onChange(composeAvatarUrl(style, seed));
  };

  return (
    <section
      aria-labelledby="assistant-avatar-heading"
      className={cn("space-y-4", className)}
    >
      <header className="space-y-1">
        <h2
          id="assistant-avatar-heading"
          className="text-lg font-heading font-medium"
        >
          Avatar
        </h2>
        <p className="text-sm text-muted-foreground">
          Personalize um apelido e escolha o estilo do avatar.
        </p>
      </header>

      <AnimatedInput
        id="assistant-avatar-seed"
        label="Apelido"
        value={seed}
        onChange={(event) => setSeed(event.target.value)}
        disabled={disabled}
        maxLength={128}
      />


      <div
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
              aria-label={`Escolher estilo ${option.label}`}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border border-border p-3 transition-colors",
                "hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50",
                isSelected && "border-primary bg-primary/5",
              )}
            >
              <AssistantAvatar
                avatarUrl={composeAvatarUrl(
                  option.value,
                  seed.length > 0 ? seed : defaultSeed,
                )}
                size="md"
              />
              <span className="text-xs text-muted-foreground">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default AssistantSettingsAvatar;
