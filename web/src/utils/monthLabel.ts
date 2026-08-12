const MONTH_LABEL_FMT = new Intl.DateTimeFormat(undefined, { month: "short" });

export function formatMonthLabel(monthKey: string): string {
  return MONTH_LABEL_FMT.format(new Date(`${monthKey}-01T00:00:00Z`));
}
