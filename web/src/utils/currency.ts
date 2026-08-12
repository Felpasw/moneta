const BRL_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BRL",
});

const BRL_SIGNED_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BRL",
  signDisplay: "always",
});

const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toNumber = (value: number | string): number =>
  typeof value === "string" ? parseFloat(value) : value;

export const formatBRL = (value: number | string): string =>
  BRL_FORMATTER.format(toNumber(value));

export const formatBRLSigned = (value: number | string): string =>
  BRL_SIGNED_FORMATTER.format(toNumber(value));

export const formatDayMonth = (date: Date): string =>
  DAY_MONTH_FORMATTER.format(date);

export const formatRelativeDay = (date: Date, reference: Date = new Date()): string => {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(date) - startOf(reference)) / MS_PER_DAY);
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > -7 && diffDays < 0) return RELATIVE_FORMATTER.format(diffDays, "day");
  return formatDayMonth(date);
};
