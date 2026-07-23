"use client";

import { AlertTriangle, Loader2, Mic, MicOff } from "lucide-react";

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
  iconClass: string;
  ringClass: string;
  disabled: boolean;
}

const STATE_VISUAL: Record<MicState, StateVisual> = {
  [MicState.Off]: {
    Icon: MicOff,
    label: "Ligar mic",
    iconClass: "text-foreground/70",
    ringClass: "ring-1 ring-foreground/20 hover:ring-foreground/40",
    disabled: false,
  },
  [MicState.Requesting]: {
    Icon: Loader2,
    label: "Solicitando permissão",
    iconClass: "text-foreground animate-spin",
    ringClass: "ring-1 ring-foreground/40",
    disabled: true,
  },
  [MicState.Live]: {
    Icon: Mic,
    label: "Desligar mic",
    iconClass: "text-background",
    ringClass: "bg-foreground animate-pulse",
    disabled: false,
  },
  [MicState.Denied]: {
    Icon: AlertTriangle,
    label: "Permissão negada",
    iconClass: "text-destructive",
    ringClass: "ring-1 ring-destructive/60",
    disabled: true,
  },
  [MicState.Error]: {
    Icon: AlertTriangle,
    label: "Erro no mic",
    iconClass: "text-destructive",
    ringClass: "ring-1 ring-destructive/60",
    disabled: true,
  },
};

export function MicButton({ state, onToggle, className }: MicButtonProps) {
  const visual = STATE_VISUAL[state];
  const { Icon } = visual;

  return (
    <button
      type="button"
      aria-label={visual.label}
      disabled={visual.disabled}
      onClick={onToggle}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-70",
        visual.ringClass,
        className,
      )}
    >
      <Icon className={cn("h-6 w-6", visual.iconClass)} aria-hidden="true" />
    </button>
  );
}

export default MicButton;
