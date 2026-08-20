import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MotionButton } from "@/components/atoms/MotionButton";

describe("<MotionButton />", () => {
  it("renders link with label and href", () => {
    render(<MotionButton label="Sign in" href="/login" />);

    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("accepts an extra className on the link wrapper", () => {
    render(<MotionButton label="Go" href="/x" className="extra-motion-btn" />);
    const link = screen.getByRole("link", { name: /go/i });
    expect(link.className).toMatch(/extra-motion-btn/);
  });
});
