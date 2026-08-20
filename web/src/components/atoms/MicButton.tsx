"use client";

import { AlertTriangle, Loader2, Mic, MicOff } from "lucide-react";

import { ShinyButton } from "@/components/atoms/ShinyButton";
import type { ShinyButtonVariant } from "@/components/atoms/interfaces/ShinyButton.interface";
import { MicState } from "@/hooks/useAgentSession";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  state: MicState;
  onToggle: () => void;
  className?: string;
}

interface StateVisual {
  Icon: typeof Mic;
  label: string;
  variant: ShinyButtonVariant;
  iconClass: string;
  disabled: boolean;
}

const STATE_VISUAL: Record<MicState, StateVisual> = {
  [MicState.Off]: {
    Icon: MicOff,
    label: "Turn on mic",
    variant: "default",
    iconClass: "text-white/90",
    disabled: false,
  },
  [MicState.Requesting]: {
    Icon: Loader2,
    label: "Requesting permission",
    variant: "default",
    iconClass: "text-white/90 animate-spin",
    disabled: true,
  },
  [MicState.Live]: {
    Icon: Mic,
    label: "Turn off mic",
    variant: "green",
    iconClass: "text-green-300 animate-pulse",
    disabled: false,
  },
  [MicState.Denied]: {
    Icon: AlertTriangle,
    label: "Permission denied",
    variant: "red",
    iconClass: "text-red-300",
    disabled: true,
  },
  [MicState.Error]: {
    Icon: AlertTriangle,
    label: "Mic error",
    variant: "red",
    iconClass: "text-red-300",
    disabled: true,
  },
};

export function MicButton({ state, onToggle, className }: MicButtonProps) {
  const visual = STATE_VISUAL[state];
  const { Icon } = visual;

  return (
    <ShinyButton
      ariaLabel={visual.label}
      variant={visual.variant}
      onClick={onToggle}
      disabled={visual.disabled}
      className={cn("p-2", className)}
      icon={<Icon aria-hidden className={cn("h-6 w-6", visual.iconClass)} />}
    />
  );
}

export default MicButton;
