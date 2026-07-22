import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PoweredByFooter } from "@/components/atoms/PoweredByFooter";

describe("<PoweredByFooter />", () => {
  it("renderiza link externo pra o autor", () => {
    render(<PoweredByFooter />);

    const link = screen.getByRole("link", { name: /felpasw/i });
    expect(link).toHaveAttribute("href", "https://felipeclacerda.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("mostra a label 'powered by'", () => {
    render(<PoweredByFooter />);
    expect(screen.getByText(/powered by/i)).toBeInTheDocument();
  });
});
