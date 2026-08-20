"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { DayPicker } from "react-day-picker";

import type { DateRangePopoverProps } from "@/components/molecules/interfaces/DateRangePopover.interface";
import { DATE_RANGE_PRESETS } from "@/utils/dateRange";

import "react-day-picker/style.css";

const POPOVER_TRANSITION = { duration: 0.18, ease: "easeOut" } as const;

const DAY_PICKER_CLASS_NAMES = {
  months: "flex flex-col",
  month_caption: "text-center text-sm font-medium mb-2",
  weekday: "text-xs text-muted-foreground",
  day: "size-9 text-sm",
  day_button:
    "flex size-9 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  selected: "!bg-foreground !text-background",
  range_middle: "!bg-muted !text-foreground",
  range_start: "!rounded-l-md !rounded-r-none",
  range_end: "!rounded-r-md !rounded-l-none",
  today: "underline",
  outside: "text-muted-foreground/40",
} as const;

const DAY_PICKER_COMPONENTS = {
  Chevron: ({ orientation }: { orientation?: "left" | "right" | "up" | "down" }) =>
    orientation === "left" ? (
      <ChevronLeft aria-hidden className="h-4 w-4" />
    ) : (
      <ChevronRight aria-hidden className="h-4 w-4" />
    ),
} as const;

export function DateRangePopover({
  draftRange,
  hasRange,
  onRangeSelect,
  onPresetSelect,
  onClear,
  onDone,
}: DateRangePopoverProps) {
  return (
    <motion.div
      role="dialog"
      aria-label="Choose date range"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={POPOVER_TRANSITION}
      className="absolute left-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
    >
      <div className="flex flex-wrap gap-2 border-b border-border p-3">
        {DATE_RANGE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPresetSelect(preset)}
            className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="p-2">
        <DayPicker
          mode="range"
          numberOfMonths={1}
          selected={draftRange}
          onSelect={onRangeSelect}
          showOutsideDays
          components={DAY_PICKER_COMPONENTS}
          classNames={DAY_PICKER_CLASS_NAMES}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border p-3">
        <button
          type="button"
          onClick={onClear}
          disabled={!hasRange}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}

export default DateRangePopover;
