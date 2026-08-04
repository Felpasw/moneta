"use client";

import { motion } from "motion/react";
import Link from "next/link";

import {
  DOT_VARIANTS,
  ICON_LIFT_TRANSITION,
  ICON_LIFT_VARIANTS,
  INNER_ICON_VARIANTS,
  OVERLAY_VARIANTS,
  TOOLTIP_TRANSITION,
  TOOLTIP_VARIANTS,
} from "@/components/ui/dockTabs.constants";
import type { DockIconProps } from "@/components/ui/interfaces/DockTabs.interface";
import { useDockMagnify } from "@/hooks/useDockMagnify";

export function DockIcon({ item, mouseX, isActive }: DockIconProps) {
  const { ref, width, height } = useDockMagnify({ mouseX });

  const iconVisual = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      className="group relative flex aspect-square cursor-pointer items-center justify-center"
    >
      <motion.div
        variants={ICON_LIFT_VARIANTS}
        transition={ICON_LIFT_TRANSITION}
        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl text-white shadow-lg ${item.color}`}
      >
        <motion.div
          variants={INNER_ICON_VARIANTS}
          transition={ICON_LIFT_TRANSITION}
          className="text-xl"
        >
          {item.icon}
        </motion.div>

        <motion.div
          variants={OVERLAY_VARIANTS}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"
        />
      </motion.div>

      <motion.div
        variants={TOOLTIP_VARIANTS}
        transition={TOOLTIP_TRANSITION}
        className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800/90 px-2 py-1 text-xs text-white backdrop-blur-sm"
      >
        {item.name}
      </motion.div>

      <motion.div
        data-active={isActive || undefined}
        variants={DOT_VARIANTS}
        transition={TOOLTIP_TRANSITION}
        className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white opacity-0 transition-[height,width,opacity] duration-200 data-[active]:h-1.5 data-[active]:w-1.5 data-[active]:opacity-100"
      />
    </motion.div>
  );

  if (item.href !== undefined) {
    return (
      <Link
        href={item.href}
        aria-label={item.name}
        aria-current={isActive ? "page" : undefined}
        className="flex items-end"
      >
        {iconVisual}
      </Link>
    );
  }

  if (item.onClick !== undefined) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        aria-label={item.name}
        className="flex items-end"
      >
        {iconVisual}
      </button>
    );
  }

  return iconVisual;
}

export default DockIcon;
