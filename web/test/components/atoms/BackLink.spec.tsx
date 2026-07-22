import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BackLink } from "@/components/atoms/BackLink";

describe("<BackLink />", () => {
  it("renderiza link com href e label default 'Voltar'", () => {
    render(<BackLink href="/" />);

    const link = screen.getByRole("link", { name: /voltar/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("aceita label customizado", () => {
    render(<BackLink href="/somewhere" label="Cancelar" />);

    expect(screen.getByRole("link", { name: /cancelar/i })).toBeInTheDocument();
  });
});
