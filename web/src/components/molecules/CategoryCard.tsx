"use client";

import { motion } from "motion/react";

import type { CategoryCardProps } from "@/components/molecules/interfaces/CategoryCard.interface";
import type { CategoryWithUsage } from "@/services/interfaces/categories.interface";
import { formatBRL } from "@/utils/currency";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

const budgetLabel = (monthlyBudget: number | null) => {
  if (monthlyBudget === null) return "No budget";
  return `Budget ${formatBRL(monthlyBudget)}`;
};

const usageLabel = (category: CategoryWithUsage) => {
  if (category.overBudget) return "Over budget";
  return `${category.usagePct}% used`;
};

export function CategoryCard({ category }: CategoryCardProps) {
  const hasBudget = category.monthlyBudget !== null;
  return (
    <motion.div
      variants={SETTINGS_STAGGER_ITEM}
      className="flex h-full flex-col gap-3 rounded-2xl bg-neutral-900 p-5 text-neutral-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-lg">
          <span aria-hidden>{category.icon ?? "•"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{category.name}</p>
          <p className="truncate text-xs opacity-60">
            {budgetLabel(category.monthlyBudget)}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide opacity-60">
          Spent this month
        </p>
        <p
          data-over-budget={category.overBudget}
          className="font-heading text-lg font-semibold data-[over-budget=true]:underline data-[over-budget=true]:decoration-2 data-[over-budget=true]:underline-offset-4"
        >
          {formatBRL(category.spent)}
        </p>
      </div>

      {hasBudget && (
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${category.usagePct}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-white"
            />
          </div>
          <p className="text-[10px] uppercase tracking-wide opacity-60">
            {usageLabel(category)}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default CategoryCard;
