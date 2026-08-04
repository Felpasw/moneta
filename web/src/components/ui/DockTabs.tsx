"use client";

import { motion, useMotionValue } from "motion/react";

import { DockGlassFilter } from "@/components/ui/DockGlassFilter";
import { DockIcon } from "@/components/ui/DockIcon";
import {
  GLASS_FILTER_ID,
  GLASS_INSET_SHADOW,
  GLASS_OUTER_SHADOW,
} from "@/components/ui/dockTabs.constants";
import type {
  DockItem,
  DockTabsProps,
} from "@/components/ui/interfaces/DockTabs.interface";
import { useActiveHref } from "@/hooks/useActiveHref";

const ENTRANCE_TRANSITION = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
  delay: 0.1,
};

export function DockTabs({ items, className }: DockTabsProps) {
  const mouseX = useMotionValue(Infinity);
  const activeHref = useActiveHref(items);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`relative mx-auto h-20 rounded-3xl px-4 pb-3.5 ${className ?? ""}`}
      style={{
        boxShadow: GLASS_OUTER_SHADOW,
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={ENTRANCE_TRANSITION}
    >
      <DockGlassFilter />

      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl"
        style={{
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          filter: `url(#${GLASS_FILTER_ID})`,
          isolation: "isolate",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-3xl"
        style={{ background: "rgba(255, 255, 255, 0.25)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-3xl"
        style={{ boxShadow: GLASS_INSET_SHADOW }}
      />

      <div className="relative z-30 flex h-full items-end gap-4">
        {items.map((item) => (
          <DockIcon
            key={item.id}
            item={item}
            mouseX={mouseX}
            isActive={item.href !== undefined && item.href === activeHref}
          />
        ))}
      </div>
    </motion.div>
  );
}

export type { DockItem };
export default DockTabs;
