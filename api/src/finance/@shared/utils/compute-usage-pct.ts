/**
 * Percentage (0-100, integer) of a cap that has been used.
 *
 * - Returns 0 when the cap is null / <= 0 (no target to compare against).
 * - Caps the ratio at 1 so overshoots read as 100%, not 137%.
 * - Rounds to the nearest integer so consumers never see decimals.
 *
 * Used by /accounts (invoice.totalAmount / creditLimit) and /categories
 * (spent / monthlyBudget).
 */
export const computeUsagePct = (used: number, cap: number | null): number => {
  if (cap === null || cap <= 0) return 0;
  const raw = used / cap;
  const capped = raw > 1 ? 1 : raw;
  return Math.round(capped * 100);
};
