"use client";

import { motion } from "motion/react";

import type { ChartCardProps } from "@/components/molecules/interfaces/ChartCard.interface";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

export function ChartCard({ label, title, children }: ChartCardProps) {
  return (
    <motion.div
      variants={SETTINGS_STAGGER_ITEM}
      className="rounded-2xl bg-neutral-900 p-6 text-neutral-50"
    >
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.16em] opacity-60">
          {label}
        </p>
        <h3 className="mt-1 font-heading text-base font-semibold">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

export default ChartCard;
