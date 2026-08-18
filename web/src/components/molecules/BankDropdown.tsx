"use client";

import { Check, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

import { BankIcon } from "@/components/atoms/BankIcon";
import type { BankDropdownProps } from "@/components/molecules/interfaces/BankDropdown.interface";

const DROPDOWN_TRANSITION = { duration: 0.2, ease: "easeOut" } as const;
const CHECK_TRANSITION = { type: "spring", stiffness: 500, damping: 30 } as const;

export function BankDropdown({
  accounts,
  selected,
  onSelect,
  searchQuery,
  onSearchChange,
}: BankDropdownProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return accounts
      .filter(
        (a) =>
          a.nickname.toLowerCase().includes(query) ||
          a.bank.name.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        const aSel = selected.includes(a.id);
        const bSel = selected.includes(b.id);
        if (aSel && !bSel) return -1;
        if (!aSel && bSel) return 1;
        return 0;
      });
  }, [accounts, selected, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={DROPDOWN_TRANSITION}
      className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
    >
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search banks..."
            className="w-full rounded-lg border border-transparent bg-muted/50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:bg-background"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filtered.map((account, index) => {
            const isSelected = selected.includes(account.id);
            return (
              <motion.button
                key={account.id}
                type="button"
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.02, duration: 0.15 }}
                onClick={() => onSelect(account.id)}
                data-selected={isSelected || undefined}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 data-[selected]:bg-primary/5 data-[selected]:hover:bg-primary/10"
              >
                <div
                  data-selected={isSelected || undefined}
                  className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full opacity-60 grayscale transition-all duration-200 data-[selected]:opacity-100 data-[selected]:grayscale-0"
                >
                  <BankIcon
                    bankName={account.bank.name}
                    size={36}
                    className="h-full w-full"
                  />
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <div
                    data-selected={isSelected || undefined}
                    className="truncate text-sm font-medium text-foreground/80 transition-colors data-[selected]:text-foreground"
                  >
                    {account.nickname}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {account.bank.name}
                  </div>
                </div>

                <div
                  data-selected={isSelected || undefined}
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 transition-all duration-200 data-[selected]:border-transparent data-[selected]:bg-primary"
                >
                  {isSelected ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={CHECK_TRANSITION}
                    >
                      <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                    </motion.div>
                  ) : null}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No banks found
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export default BankDropdown;
