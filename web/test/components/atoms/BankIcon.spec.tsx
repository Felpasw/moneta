import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BankIcon } from "@/components/atoms/BankIcon";

const svgBancoMock = vi.fn<
  (opts: { nome: string; tamanho?: number }) => Promise<string>
>(({ nome }) => Promise.resolve(`<svg data-slug="${nome}" />`));

vi.mock("@edusites/bancos-brasil", () => ({
  svgBanco: (opts: { nome: string; tamanho?: number }) => svgBancoMock(opts),
}));

let client: QueryClient;

const wrap = (ui: ReactElement) => (
  <QueryClientProvider client={client}>{ui}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
});

afterEach(() => {
  svgBancoMock.mockClear();
  svgBancoMock.mockImplementation(({ nome }) =>
    Promise.resolve(`<svg data-slug="${nome}" />`),
  );
});

describe("<BankIcon />", () => {
  it("resolve o slug do bankName e injeta o SVG da lib", async () => {
    const { container } = render(wrap(<BankIcon bankName="Nubank" size={40} />));

    await waitFor(() => {
      expect(svgBancoMock).toHaveBeenCalledWith({ nome: "nubank", tamanho: 40 });
    });
    await waitFor(() => {
      expect(container.querySelector('svg[data-slug="nubank"]')).not.toBeNull();
    });
  });

  it("cai no fallback com iniciais quando o banco não tem slug (Banrisul)", () => {
    render(wrap(<BankIcon bankName="Banrisul" />));

    expect(svgBancoMock).not.toHaveBeenCalled();
    expect(screen.getByRole("img", { name: "Banrisul" })).toHaveTextContent(
      "BA",
    );
  });

  it("cai no fallback quando svgBanco rejeita", async () => {
    svgBancoMock.mockImplementationOnce(() =>
      Promise.reject(new Error("boom")),
    );
    render(wrap(<BankIcon bankName="Nubank" />));

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Nubank" })).toHaveTextContent(
        "NU",
      );
    });
  });

  it("usa role=img com aria-label do bankName em ambos os estados", async () => {
    const { rerender } = render(wrap(<BankIcon bankName="Nubank" />));
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Nubank" })).toBeInTheDocument();
    });
    rerender(wrap(<BankIcon bankName="Banrisul" />));
    expect(screen.getByRole("img", { name: "Banrisul" })).toBeInTheDocument();
  });
});
