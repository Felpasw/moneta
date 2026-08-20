"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import {
  TransactionTypeFilterValue,
  type TransactionTypeFilterProps,
} from "@/components/molecules/interfaces/TransactionTypeFilter.interface";
import { cn } from "@/lib/utils";

interface Option {
  value: TransactionTypeFilterValue;
  label: string;
  Icon: LucideIcon;
  activeClass: string;
  iconActiveClass: string;
}

const OPTIONS: readonly Option[] = [
  {
    value: TransactionTypeFilterValue.All,
    label: "All",
    Icon: Wallet,
    activeClass: "border-foreground bg-foreground text-background",
    iconActiveClass: "text-background",
  },
  {
    value: TransactionTypeFilterValue.Income,
    label: "Income",
    Icon: ArrowDownLeft,
    activeClass: "border-emerald-500 bg-emerald-500/15 text-emerald-400",
    iconActiveClass: "text-emerald-400",
  },
  {
    value: TransactionTypeFilterValue.Expense,
    label: "Expense",
    Icon: ArrowUpRight,
    activeClass: "border-rose-500 bg-rose-500/15 text-rose-400",
    iconActiveClass: "text-rose-400",
  },
] as const;

const BUMP_TRANSITION = { type: "spring", stiffness: 400, damping: 25 } as const;

export function TransactionTypeFilter({
  value,
  onChange,
  label,
  className,
}: TransactionTypeFilterProps) {
  return (
    <div className={cn("inline-block", className)}>
      {label ? (
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      ) : null}
      <div role="radiogroup" aria-label="Transaction type" className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => {
          const isActive = value === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={BUMP_TRANSITION}
              data-active={isActive || undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && option.activeClass,
              )}
            >
              <option.Icon
                aria-hidden
                data-active={isActive || undefined}
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-colors",
                  isActive && option.iconActiveClass,
                )}
              />
              <span>{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default TransactionTypeFilter;
