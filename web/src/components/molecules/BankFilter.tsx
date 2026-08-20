"use client";

import { AnimatePresence, LayoutGroup } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { BankAvatar } from "@/components/molecules/BankAvatar";
import { BankDropdown } from "@/components/molecules/BankDropdown";
import { BankFilterAddButton } from "@/components/molecules/BankFilterAddButton";
import type { BankFilterProps } from "@/components/molecules/interfaces/BankFilter.interface";
import { cn } from "@/lib/utils";

export function BankFilter({
  accounts,
  selected,
  onChange,
  maxVisible = 5,
  label,
  className,
}: BankFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
      setSearchQuery("");
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sorted = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const aSel = selected.includes(a.id);
      const bSel = selected.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return 0;
    });
  }, [accounts, selected]);

  const visible = sorted.slice(0, maxVisible);

  const toggle = (id: string): void => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
      return;
    }
    onChange([...selected, id]);
  };

  return (
    <div className={cn("relative", className)}>
      {label ? (
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      ) : null}
      <div ref={containerRef} className="flex flex-wrap items-start gap-4">
        <LayoutGroup>
          {visible.map((account) => (
            <BankAvatar
              key={account.id}
              account={account}
              isSelected={selected.includes(account.id)}
              onClick={() => toggle(account.id)}
            />
          ))}

          <div className="relative">
            <BankFilterAddButton
              isOpen={isOpen}
              onClick={() => setIsOpen((prev) => !prev)}
            />
            <AnimatePresence>
              {isOpen ? (
                <BankDropdown
                  accounts={accounts}
                  selected={selected}
                  onSelect={toggle}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}

export default BankFilter;
