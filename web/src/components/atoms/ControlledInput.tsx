"use client";

import type { InputHTMLAttributes } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { AnimatedInput } from "@/components/atoms/AnimatedInput";

interface ControlledInputProps<T extends FieldValues>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange"> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  showPasswordToggle?: boolean;
}

export function ControlledInput<T extends FieldValues>({
  name,
  control,
  label,
  showPasswordToggle,
  ...rest
}: ControlledInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <AnimatedInput
            {...rest}
            {...field}
            label={label}
            value={(field.value as string | undefined) ?? ""}
            showPasswordToggle={showPasswordToggle}
            aria-invalid={Boolean(fieldState.error)}
          />
          {fieldState.error ? (
            <p className="text-xs font-medium text-destructive" role="alert">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

export default ControlledInput;
