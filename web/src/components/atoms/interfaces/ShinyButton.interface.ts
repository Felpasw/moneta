import type { MouseEvent, ReactNode } from "react";

export type ShinyButtonVariant = "default" | "green" | "indigo" | "red";

export interface ShinyButtonProps {
  icon: ReactNode;
  ariaLabel: string;
  variant?: ShinyButtonVariant;
  onClick?: () => void;
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
}
