"use client";

import { motion } from "motion/react";

import {
  AnimatedRadioGroup,
  type AnimatedRadioOption,
} from "@/components/atoms/AnimatedRadioGroup";
import { cn } from "@/lib/utils";
import type { OutputLanguage } from "@/services/interfaces/assistantProfile.interface";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

import { OUTPUT_LANGUAGE_OPTIONS } from "./assistantSettings.constants";

interface AssistantSettingsLanguageProps {
  value: OutputLanguage;
  onChange: (value: OutputLanguage) => void;
  disabled?: boolean;
  className?: string;
}

const RADIO_OPTIONS: AnimatedRadioOption<OutputLanguage>[] =
  OUTPUT_LANGUAGE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    description: option.description,
  }));

export function AssistantSettingsLanguage({
  value,
  onChange,
  disabled,
  className,
}: AssistantSettingsLanguageProps) {
  return (
    <section
      aria-labelledby="assistant-language-heading"
      className={cn("space-y-4", className)}
    >
      <motion.header variants={SETTINGS_STAGGER_ITEM} className="space-y-1">
        <h2
          id="assistant-language-heading"
          className="text-lg font-heading font-medium"
        >
          Reply language
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose the language the assistant speaks in. Takes effect on the next
          session.
        </p>
      </motion.header>

      <motion.div variants={SETTINGS_STAGGER_ITEM}>
        <AnimatedRadioGroup<OutputLanguage>
          name="assistant-output-language"
          ariaLabel="Reply language"
          options={RADIO_OPTIONS}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      </motion.div>
    </section>
  );
}

export default AssistantSettingsLanguage;
