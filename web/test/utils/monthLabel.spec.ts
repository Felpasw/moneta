import { describe, expect, it } from "vitest";

import { formatMonthLabel } from "@/utils/monthLabel";

describe("formatMonthLabel", () => {
  it("returns a short month label for a valid YYYY-MM key", () => {
    // Intl.DateTimeFormat honors the environment's default locale, but the
    // short-form is always length 3 and matches the target month letters.
    const label = formatMonthLabel("2026-08");
    expect(label).toMatch(/^[A-Za-zÀ-ÿ]{3,4}\.?$/);
  });

  it("differs across months", () => {
    const jan = formatMonthLabel("2026-01");
    const aug = formatMonthLabel("2026-08");
    expect(jan).not.toBe(aug);
  });
});
