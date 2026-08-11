"use client";

import { motion } from "motion/react";

import type { KpiCardProps } from "@/components/molecules/interfaces/KpiCard.interface";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

export function KpiCard({
  label,
  value,
  hint,
  emphasis = "primary",
  negative,
}: KpiCardProps) {
  return (
    <motion.div
      variants={SETTINGS_STAGGER_ITEM}
      data-emphasis={emphasis}
      className="rounded-2xl bg-neutral-900 p-5 text-neutral-50"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-60">
        {label}
      </p>
      <p
        data-negative={negative}
        className="mt-2 font-heading text-2xl font-semibold tabular-nums data-[negative=true]:underline data-[negative=true]:decoration-2 data-[negative=true]:underline-offset-4"
      >
        {value}
      </p>
      {hint !== undefined ? (
        <p className="mt-1 text-xs opacity-60">{hint}</p>
      ) : null}
    </motion.div>
  );
}

export default KpiCard;
