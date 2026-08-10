import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShutterText } from "@/components/atoms/ShutterText";

describe("<ShutterText />", () => {
  it("renderiza o texto (cada char em span próprio)", () => {
    const { container } = render(<ShutterText text="OI" />);
    expect(container.textContent).toContain("O");
    expect(container.textContent).toContain("I");
  });

  it("é aria-hidden — acessibilidade fica no wrapper (ex: aria-label do Link)", () => {
    const { container } = render(<ShutterText text="MONETA" />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute("aria-hidden", "true");
  });

  it("aceita className custom", () => {
    const { container } = render(
      <ShutterText text="A" className="extra-shutter" />,
    );
    expect(container.firstElementChild?.className).toMatch(/extra-shutter/);
  });
});
