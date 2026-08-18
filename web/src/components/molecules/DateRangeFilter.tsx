"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";

import { DateRangePopover } from "@/components/molecules/DateRangePopover";
import { DateRangeTrigger } from "@/components/molecules/DateRangeTrigger";
import type { DateRangeFilterProps } from "@/components/molecules/interfaces/DateRangeFilter.interface";
import { cn } from "@/lib/utils";
import { toDayPickerRange, type DateRangePreset } from "@/utils/dateRange";

export function DateRangeFilter({
  value,
  onChange,
  label,
  className,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    toDayPickerRange(value),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent): void => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setDraftRange(toDayPickerRange(value));
  }, [value]);

  const handleRangeSelect = (range: DateRange | undefined): void => {
    setDraftRange(range);
    if (!range) {
      onChange({ from: null, to: null });
      return;
    }
    if (range.from && range.to) {
      onChange({ from: range.from, to: range.to });
      setIsOpen(false);
    }
  };

  const handlePreset = (preset: DateRangePreset): void => {
    onChange(preset.compute(new Date()));
    setIsOpen(false);
  };

  const handleClear = (): void => {
    onChange({ from: null, to: null });
    setIsOpen(false);
  };

  const hasRange = value.from !== null || value.to !== null;

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      {label ? (
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      ) : null}

      <DateRangeTrigger
        value={value}
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
        onClear={handleClear}
      />

      <AnimatePresence>
        {isOpen ? (
          <DateRangePopover
            draftRange={draftRange}
            hasRange={hasRange}
            onRangeSelect={handleRangeSelect}
            onPresetSelect={handlePreset}
            onClear={handleClear}
            onDone={() => setIsOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default DateRangeFilter;
