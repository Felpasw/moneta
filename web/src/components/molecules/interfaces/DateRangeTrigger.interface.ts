import type { DateRangeValue } from "@/components/molecules/interfaces/DateRangeFilter.interface";

export interface DateRangeTriggerProps {
  value: DateRangeValue;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}
