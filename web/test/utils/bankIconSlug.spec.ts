import { describe, expect, it } from "vitest";

import {
  BANK_ICON_SLUG,
  resolveBankIconSlug,
} from "@/utils/bankIconSlug";

describe("resolveBankIconSlug()", () => {
  it("mapeia os bancos do seed pros slugs da lib", () => {
    expect(resolveBankIconSlug("Nubank")).toBe("nubank");
    expect(resolveBankIconSlug("PicPay")).toBe("picpay");
    expect(resolveBankIconSlug("BTG Pactual")).toBe("btg");
    expect(resolveBankIconSlug("Itaú Unibanco")).toBe("itau");
    expect(resolveBankIconSlug("Banco BV")).toBe("bv");
    expect(resolveBankIconSlug("Mercado Pago")).toBe("mercadopago");
    expect(resolveBankIconSlug("Caixa Econômica Federal")).toBe("caixa");
  });

  it("retorna null pros bancos sem cobertura na lib (ex: Banrisul)", () => {
    expect(resolveBankIconSlug("Banrisul")).toBeNull();
  });

  it("retorna null pra nomes desconhecidos", () => {
    expect(resolveBankIconSlug("Banco Fantasma")).toBeNull();
    expect(resolveBankIconSlug("")).toBeNull();
  });

  it("mantém todos os 21 bancos do seed listados no mapa", () => {
    const expected = [
      "Banco do Brasil",
      "Santander",
      "Banrisul",
      "Banco Inter",
      "XP Investimentos",
      "Caixa Econômica Federal",
      "BTG Pactual",
      "Banco Original",
      "Bradesco",
      "Nubank",
      "PagBank",
      "Mercado Pago",
      "Banco C6",
      "Itaú Unibanco",
      "PicPay",
      "Banco Safra",
      "Banco Pan",
      "Banco BV",
      "Neon",
      "Sicredi",
      "Sicoob",
    ];
    for (const name of expected) {
      expect(BANK_ICON_SLUG).toHaveProperty(name);
    }
  });
});
