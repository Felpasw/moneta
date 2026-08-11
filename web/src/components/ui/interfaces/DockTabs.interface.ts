import type { MotionValue } from "motion/react";
import type { ReactNode } from "react";

export interface DockItem {
  id: string;
  name: string;
  icon: ReactNode;
  color: string;
  href?: string;
  onClick?: () => void;
}

export interface DockIconProps {
  item: DockItem;
  mouseX: MotionValue<number>;
  isActive: boolean;
}

export interface DockTabsProps {
  items: DockItem[];
  className?: string;
}
