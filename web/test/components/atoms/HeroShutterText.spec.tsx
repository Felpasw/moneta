import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroShutterText } from "@/components/atoms/HeroShutterText";

describe("<HeroShutterText />", () => {
  it("renderiza um link com aria-label = texto e href alvo", () => {
    render(<HeroShutterText text="MONETA" href="/login" />);

    const link = screen.getByRole("link", { name: "MONETA" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("usa 'MONETA' como texto default", () => {
    render(<HeroShutterText />);
    expect(screen.getByRole("link", { name: "MONETA" })).toBeInTheDocument();
  });

  it("aceita textSizeClass e className customizados", () => {
    render(
      <HeroShutterText
        text="OI"
        className="extra-hero"
        textSizeClass="text-4xl"
      />,
    );
    const link = screen.getByRole("link", { name: "OI" });
    expect(link.className).toMatch(/extra-hero/);
  });
});
