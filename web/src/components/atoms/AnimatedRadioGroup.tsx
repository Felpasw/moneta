"use client";

import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedRadioOption<TValue extends string = string> {
  value: TValue;
  label: string;
  description?: string;
  accentClass?: string;
}

interface AnimatedRadioGroupProps<TValue extends string = string> {
  name: string;
  ariaLabel: string;
  options: AnimatedRadioOption<TValue>[];
  value: TValue;
  onChange?: (value: TValue) => void;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCENT = "text-foreground border-foreground";

export function AnimatedRadioGroup<TValue extends string = string>({
  name,
  ariaLabel,
  options,
  value,
  onChange,
  disabled,
  className,
}: AnimatedRadioGroupProps<TValue>) {
  const handleSelect = (next: TValue) => {
    if (disabled) return;
    if (next === value) return;
    onChange?.(next);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    next: TValue,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleSelect(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("space-y-4", className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const accent = option.accentClass ?? DEFAULT_ACCENT;
        const inputId = `${name}-${option.value}`;
        const descriptionId = option.description
          ? `${inputId}-description`
          : undefined;

        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={cn(
              "group flex select-none items-start gap-4",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            )}
          >
            <span className="relative mt-0.5 flex items-center justify-center">
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={disabled}
                onChange={() => handleSelect(option.value)}
                onKeyDown={(event) => handleKeyDown(event, option.value)}
                className="sr-only"
                aria-label={option.label}
                aria-describedby={descriptionId}
              />
              <span
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ease-out",
                  isSelected
                    ? cn(accent, "scale-90")
                    : "border-muted-foreground/40 group-hover:scale-110 group-hover:border-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-300",
                    isSelected
                      ? cn(accent, "bg-current scale-100")
                      : "scale-0 bg-muted-foreground",
                  )}
                />
                {isSelected ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute h-9 w-9 animate-spin rounded-full border-2 border-transparent shadow-lg",
                      accent,
                    )}
                    style={{
                      borderTopColor: "currentColor",
                      animationDuration: "2s",
                    }}
                  />
                ) : null}
              </span>
            </span>

            <span className="flex flex-col">
              <span
                className={cn(
                  "text-base font-medium transition-colors duration-300",
                  isSelected
                    ? "font-bold text-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {option.label}
              </span>
              {option.description ? (
                <span
                  id={descriptionId}
                  className="mt-1 text-sm text-muted-foreground"
                >
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default AnimatedRadioGroup;
