import {
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import type { DateRangeValue } from "@/components/molecules/interfaces/DateRangeFilter.interface";

export interface DateRangePreset {
  id: string;
  label: string;
  compute: (today: Date) => DateRangeValue;
}

export const DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  {
    id: "this-month",
    label: "This month",
    compute: (today) => ({ from: startOfMonth(today), to: endOfMonth(today) }),
  },
  {
    id: "last-30",
    label: "Last 30 days",
    compute: (today) => ({ from: subDays(startOfDay(today), 29), to: startOfDay(today) }),
  },
  {
    id: "last-90",
    label: "Last 90 days",
    compute: (today) => ({ from: subDays(startOfDay(today), 89), to: startOfDay(today) }),
  },
  {
    id: "this-year",
    label: "This year",
    compute: (today) => ({ from: startOfYear(today), to: startOfDay(today) }),
  },
] as const;

const formatShort = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatDateRangeLabel = (value: DateRangeValue): string => {
  if (value.from && value.to) {
    return `${formatShort(value.from)} → ${formatShort(value.to)}`;
  }
  if (value.from) return `${formatShort(value.from)} → …`;
  return "All time";
};

export const toDayPickerRange = (value: DateRangeValue): DateRange | undefined =>
  value.from ? { from: value.from, to: value.to ?? undefined } : undefined;
