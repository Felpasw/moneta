import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MotionButton } from "@/components/atoms/MotionButton";

describe("<MotionButton />", () => {
  it("renderiza link com label e href", () => {
    render(<MotionButton label="Entrar" href="/login" />);

    const link = screen.getByRole("link", { name: /entrar/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("aceita className extra no wrapper do link", () => {
    render(<MotionButton label="Ir" href="/x" className="extra-motion-btn" />);
    const link = screen.getByRole("link", { name: /ir/i });
    expect(link.className).toMatch(/extra-motion-btn/);
  });
});
