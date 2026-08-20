import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RippleLoader } from "@/components/atoms/RippleLoader";

describe("RippleLoader", () => {
  it("renders 9 cells in a 3x3 grid", () => {
    const { container } = render(<RippleLoader />);
    const cells = container.querySelectorAll("[data-slot=ripple-loader-cell]");
    expect(cells).toHaveLength(9);
  });

  it("exposes role=status with default accessible label", () => {
    render(<RippleLoader />);
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });

  it("accepts a custom label", () => {
    render(<RippleLoader label="Syncing data" />);
    expect(
      screen.getByRole("status", { name: /syncing data/i }),
    ).toBeInTheDocument();
  });

  it("applies animation-delay inline on each cell", () => {
    const { container } = render(<RippleLoader />);
    const cells = Array.from(
      container.querySelectorAll<HTMLElement>("[data-slot=ripple-loader-cell]"),
    );

    for (const cell of cells) {
      expect(cell.style.animationDelay).not.toBe("");
    }
  });

  it("wrapper applies text-foreground so the ripple uses currentColor", () => {
    const { container } = render(<RippleLoader />);
    const wrapper = container.querySelector("[data-slot=ripple-loader]");
    expect(wrapper?.className).toContain("text-foreground");
  });

  it("merges a custom className into the wrapper", () => {
    const { container } = render(<RippleLoader className="my-4" />);
    const wrapper = container.querySelector("[data-slot=ripple-loader]");
    expect(wrapper?.className).toContain("my-4");
  });
});
