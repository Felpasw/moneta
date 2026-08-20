import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AboutScreen } from "@/components/templates/AboutScreen";

const VERSIONS = { web: "0.4.0", api: "0.7.0" };

describe("<AboutScreen />", () => {
  it("renders MONETA as the animated title", () => {
    render(<AboutScreen versions={VERSIONS} />);
    expect(screen.getByText("MONETA")).toBeInTheDocument();
  });

  it("shows the web version", () => {
    render(<AboutScreen versions={VERSIONS} />);
    const list = screen.getByLabelText(/app versions/i);
    expect(list).toHaveTextContent(/v0\.4\.0/);
    expect(list).toHaveTextContent(/web/i);
  });

  it("shows the api version", () => {
    render(<AboutScreen versions={VERSIONS} />);
    const list = screen.getByLabelText(/app versions/i);
    expect(list).toHaveTextContent(/v0\.7\.0/);
    expect(list).toHaveTextContent(/api/i);
  });

  it("links to the Moneta site with target=_blank + safe rel", () => {
    render(<AboutScreen versions={VERSIONS} />);
    const link = screen.getByRole("link", {
      name: /moneta\.felipeclacerda\.com/i,
    });
    expect(link).toHaveAttribute("href", "https://moneta.felipeclacerda.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringMatching(/noopener/));
    expect(link).toHaveAttribute("rel", expect.stringMatching(/noreferrer/));
  });

  it("links to the author's portfolio with target=_blank + safe rel", () => {
    render(<AboutScreen versions={VERSIONS} />);
    const link = screen.getByRole("link", {
      name: /^felipeclacerda\.com/i,
    });
    expect(link).toHaveAttribute("href", "https://felipeclacerda.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringMatching(/noopener/));
  });

  it("shows a product description", () => {
    render(<AboutScreen versions={VERSIONS} />);
    expect(screen.getByText(/conversational/i)).toBeInTheDocument();
  });
});
