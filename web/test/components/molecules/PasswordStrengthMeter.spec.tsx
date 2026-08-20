import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordStrengthMeter } from "@/components/molecules/PasswordStrengthMeter";

describe("<PasswordStrengthMeter />", () => {
  it("does not show a strength label when value is empty", () => {
    render(<PasswordStrengthMeter value="" />);
    expect(screen.queryByText(/weak|fair|good|strong/i)).toBeNull();
  });

  it("shows 'Weak' for an 8-char password with no variety", () => {
    render(<PasswordStrengthMeter value="abcdefgh" />);
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it("shows 'Very strong' for a long password with variety", () => {
    render(<PasswordStrengthMeter value="Abcdefgh123!@#" />);
    expect(screen.getByText(/very strong/i)).toBeInTheDocument();
  });
});
