import type { DateRange } from "react-day-picker";

import type { DateRangePreset } from "@/utils/dateRange";

export interface DateRangePopoverProps {
  draftRange: DateRange | undefined;
  hasRange: boolean;
  onRangeSelect: (range: DateRange | undefined) => void;
  onPresetSelect: (preset: DateRangePreset) => void;
  onClear: () => void;
  onDone: () => void;
}
