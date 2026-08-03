"use client";

import {
  AnimatedRadioGroup,
  type AnimatedRadioOption,
} from "@/components/atoms/AnimatedRadioGroup";
import { cn } from "@/lib/utils";
import type { TreatmentStyle } from "@/services/interfaces/assistantProfile.interface";

import { TREATMENT_STYLE_OPTIONS } from "./assistantSettings.constants";

interface AssistantSettingsTreatmentStyleProps {
  value: TreatmentStyle;
  onChange: (value: TreatmentStyle) => void;
  disabled?: boolean;
  className?: string;
}

const RADIO_OPTIONS: AnimatedRadioOption<TreatmentStyle>[] =
  TREATMENT_STYLE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    description: `“${option.example}”`,
    accentClass: option.accentClass,
  }));

export function AssistantSettingsTreatmentStyle({
  value,
  onChange,
  disabled,
  className,
}: AssistantSettingsTreatmentStyleProps) {
  return (
    <section
      aria-labelledby="assistant-treatment-style-heading"
      className={cn("space-y-4", className)}
    >
      <header className="space-y-1">
        <h2
          id="assistant-treatment-style-heading"
          className="text-lg font-heading font-medium"
        >
          Tom de tratamento
        </h2>
        <p className="text-sm text-muted-foreground">
          Escolha como o assistente fala com você.
        </p>
      </header>

      <AnimatedRadioGroup<TreatmentStyle>
        name="assistant-treatment-style"
        ariaLabel="Tom de tratamento"
        options={RADIO_OPTIONS}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </section>
  );
}

export default AssistantSettingsTreatmentStyle;
