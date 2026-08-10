import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AboutScreen } from "@/components/templates/AboutScreen";

const VERSIONS = { web: "0.4.0", api: "0.7.0" };

describe("<AboutScreen />", () => {
  it("renderiza MONETA como título animado", () => {
    render(<AboutScreen versions={VERSIONS} />);
    expect(screen.getByText("MONETA")).toBeInTheDocument();
  });

  it("mostra a versão do web", () => {
    render(<AboutScreen versions={VERSIONS} />);
    const list = screen.getByLabelText(/app versions/i);
    expect(list).toHaveTextContent(/v0\.4\.0/);
    expect(list).toHaveTextContent(/web/i);
  });

  it("mostra a versão da api", () => {
    render(<AboutScreen versions={VERSIONS} />);
    const list = screen.getByLabelText(/app versions/i);
    expect(list).toHaveTextContent(/v0\.7\.0/);
    expect(list).toHaveTextContent(/api/i);
  });

  it("linka pro site do Moneta com target=_blank + rel de segurança", () => {
    render(<AboutScreen versions={VERSIONS} />);
    const link = screen.getByRole("link", {
      name: /moneta\.felipeclacerda\.com/i,
    });
    expect(link).toHaveAttribute("href", "https://moneta.felipeclacerda.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringMatching(/noopener/));
    expect(link).toHaveAttribute("rel", expect.stringMatching(/noreferrer/));
  });

  it("linka pro portfolio do autor com target=_blank + rel de segurança", () => {
    render(<AboutScreen versions={VERSIONS} />);
    const link = screen.getByRole("link", {
      name: /^felipeclacerda\.com/i,
    });
    expect(link).toHaveAttribute("href", "https://felipeclacerda.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringMatching(/noopener/));
  });

  it("mostra uma descrição do produto", () => {
    render(<AboutScreen versions={VERSIONS} />);
    expect(screen.getByText(/conversacional/i)).toBeInTheDocument();
  });
});
