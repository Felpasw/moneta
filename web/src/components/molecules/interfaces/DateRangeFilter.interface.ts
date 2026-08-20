export interface DateRangeValue {
  from: Date | null;
  to: Date | null;
}

export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  label?: string;
  className?: string;
}
