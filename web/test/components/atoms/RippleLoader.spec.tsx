import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RippleLoader } from "@/components/atoms/RippleLoader";

describe("RippleLoader", () => {
  it("renderiza 9 cells em grid 3x3", () => {
    const { container } = render(<RippleLoader />);
    const cells = container.querySelectorAll("[data-slot=ripple-loader-cell]");
    expect(cells).toHaveLength(9);
  });

  it("expõe role=status com label acessível default", () => {
    render(<RippleLoader />);
    expect(screen.getByRole("status", { name: /carregando/i })).toBeInTheDocument();
  });

  it("aceita label customizado", () => {
    render(<RippleLoader label="Sincronizando dados" />);
    expect(
      screen.getByRole("status", { name: /sincronizando dados/i }),
    ).toBeInTheDocument();
  });

  it("cada cell aplica animation-delay inline", () => {
    const { container } = render(<RippleLoader />);
    const cells = Array.from(
      container.querySelectorAll<HTMLElement>("[data-slot=ripple-loader-cell]"),
    );

    for (const cell of cells) {
      expect(cell.style.animationDelay).not.toBe("");
    }
  });

  it("wrapper aplica text-foreground pra ripple usar currentColor mono", () => {
    const { container } = render(<RippleLoader />);
    const wrapper = container.querySelector("[data-slot=ripple-loader]");
    expect(wrapper?.className).toContain("text-foreground");
  });

  it("mescla className customizada no wrapper", () => {
    const { container } = render(<RippleLoader className="my-4" />);
    const wrapper = container.querySelector("[data-slot=ripple-loader]");
    expect(wrapper?.className).toContain("my-4");
  });
});
