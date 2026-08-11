import {
  LineChart,
  Mic,
  Receipt,
  ShieldCheck,
  Sparkles,
  Tags,
  Wallet,
} from "lucide-react";

import type { Capability } from "@/components/organisms/interfaces/AssistantCapabilitiesPopover.interface";

export const CAPABILITIES: readonly Capability[] = [
  { id: "voice", title: "Talk by voice", Icon: Mic },
  { id: "accounts", title: "Accounts and cards", Icon: Wallet },
  { id: "transactions", title: "Log transactions", Icon: Receipt },
  { id: "analysis", title: "Analyze spending", Icon: LineChart },
  { id: "categories", title: "Category budgets", Icon: Tags },
  { id: "personalization", title: "Personalize the assistant", Icon: Sparkles },
  { id: "privacy", title: "Your data stays here", Icon: ShieldCheck },
];

export const POPOVER_TRANSITION = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as const,
};
