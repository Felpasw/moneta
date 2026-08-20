"use client";

import { CalendarRange, X } from "lucide-react";

import type { DateRangeTriggerProps } from "@/components/molecules/interfaces/DateRangeTrigger.interface";
import { formatDateRangeLabel } from "@/utils/dateRange";

export function DateRangeTrigger({
  value,
  isOpen,
  onToggle,
  onClear,
}: DateRangeTriggerProps) {
  const hasRange = value.from !== null || value.to !== null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      data-active={hasRange || undefined}
      className="inline-flex items-center gap-3 rounded-full border border-border bg-background/60 px-6 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[active]:text-foreground"
    >
      <CalendarRange aria-hidden className="h-5 w-5" />
      <span>{formatDateRangeLabel(value)}</span>
      {hasRange ? (
        <span
          role="button"
          tabIndex={0}
          aria-label="Clear date range"
          onClick={(event) => {
            event.stopPropagation();
            onClear();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onClear();
            }
          }}
          className="-mr-1 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden className="h-4 w-4" />
        </span>
      ) : null}
    </button>
  );
}

export default DateRangeTrigger;
