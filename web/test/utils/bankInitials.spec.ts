import { describe, expect, it } from "vitest";

import { bankInitials } from "@/utils/bankInitials";

describe("bankInitials()", () => {
  it("pega as duas primeiras letras quando é uma palavra só", () => {
    expect(bankInitials("Nubank")).toBe("NU");
    expect(bankInitials("Banrisul")).toBe("BA");
    expect(bankInitials("Sicoob")).toBe("SI");
  });

  it("pega a inicial das duas primeiras palavras quando são múltiplas", () => {
    expect(bankInitials("Mercado Pago")).toBe("MP");
    expect(bankInitials("XP Investimentos")).toBe("XI");
  });

  it("ignora stopwords: banco/do/de/da/dos/das", () => {
    expect(bankInitials("Banco do Brasil")).toBe("BR");
    expect(bankInitials("Banco Fantasma")).toBe("FA");
    expect(bankInitials("Banco de Investimento")).toBe("IN");
  });

  it("stopwords são case-insensitive", () => {
    expect(bankInitials("BANCO DO FANTASMA")).toBe("FA");
  });

  it("cai no bankName original quando todas as palavras são stopwords", () => {
    expect(bankInitials("Banco do")).toBe("BA");
  });

  it("sempre devolve uppercase", () => {
    expect(bankInitials("nubank")).toBe("NU");
    expect(bankInitials("mercado pago")).toBe("MP");
  });
});
