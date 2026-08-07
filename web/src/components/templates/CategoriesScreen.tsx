"use client";

import { motion } from "motion/react";

import {
  MOCK_CATEGORIES_MONTH_LABEL,
  MOCK_CATEGORY_ROWS,
} from "@/mocks/finance";
import { formatBRL } from "@/utils/currency";
import {
  SETTINGS_STAGGER_CONTAINER,
  SETTINGS_STAGGER_ITEM,
} from "@/utils/settingsStagger";

export function CategoriesScreen() {
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Spending by category in {MOCK_CATEGORIES_MONTH_LABEL}.
        </p>
      </section>

      <motion.section
        variants={SETTINGS_STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        aria-label="Categories list"
        className="grid gap-3 sm:grid-cols-2"
      >
        {MOCK_CATEGORY_ROWS.map((category) => (
          <motion.div
            key={category.id}
            variants={SETTINGS_STAGGER_ITEM}
            className="flex h-full flex-col gap-3 rounded-2xl bg-neutral-900 p-5 text-neutral-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-lg">
                <span aria-hidden>{category.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category.name}</p>
                <p className="truncate text-xs opacity-60">
                  {category.budget !== null
                    ? `Budget ${formatBRL(category.budget)}`
                    : "No budget"}
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

            {category.budget !== null ? (
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
                  {category.overBudget
                    ? "Over budget"
                    : `${category.usagePct}% used`}
                </p>
              </div>
            ) : null}
          </motion.div>
        ))}
      </motion.section>
    </main>
  );
}

export default CategoriesScreen;
