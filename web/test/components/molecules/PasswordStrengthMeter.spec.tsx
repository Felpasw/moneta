import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordStrengthMeter } from "@/components/molecules/PasswordStrengthMeter";

describe("<PasswordStrengthMeter />", () => {
  it("não mostra label de força quando value é vazio", () => {
    render(<PasswordStrengthMeter value="" />);
    expect(screen.queryByText(/fraca|razoável|boa|forte/i)).toBeNull();
  });

  it("mostra 'fraca' pra senha de 8 chars sem variedade", () => {
    render(<PasswordStrengthMeter value="abcdefgh" />);
    expect(screen.getByText(/fraca/i)).toBeInTheDocument();
  });

  it("mostra 'muito forte' pra senha longa com variedade", () => {
    render(<PasswordStrengthMeter value="Abcdefgh123!@#" />);
    expect(screen.getByText(/muito forte/i)).toBeInTheDocument();
  });
});
