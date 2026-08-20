import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BackLink } from "@/components/atoms/BackLink";

describe("<BackLink />", () => {
  it("renders link with href and default label 'Back'", () => {
    render(<BackLink href="/" />);

    const link = screen.getByRole("link", { name: /back/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("accepts a custom label", () => {
    render(<BackLink href="/somewhere" label="Cancel" />);

    expect(screen.getByRole("link", { name: /cancel/i })).toBeInTheDocument();
  });
});
