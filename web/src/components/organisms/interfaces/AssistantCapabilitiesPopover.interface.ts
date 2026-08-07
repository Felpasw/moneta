import type { LucideIcon } from "lucide-react";

export interface Capability {
  id: string;
  title: string;
  Icon: LucideIcon;
}

export interface AssistantCapabilitiesPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
