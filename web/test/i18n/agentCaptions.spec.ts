import { describe, expect, it } from "vitest";

import { ToolCaptionKey } from "@/hooks/constants/useAgentSession.constants";
import { translateCaption } from "@/i18n/agentCaptions";

describe("translateCaption()", () => {
  describe("pt_BR", () => {
    it("installment_purchase.registering: inclui count", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.InstallmentPurchaseRegistering,
            params: { count: 4 },
          },
          "pt_BR",
        ),
      ).toBe("Registrando compra em 4x…");
    });

    it("installment_purchase.registering: com description", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.InstallmentPurchaseRegistering,
            params: { count: 4, description: "PS5" },
          },
          "pt_BR",
        ),
      ).toBe("Registrando compra em 4x (PS5)…");
    });

    it("transaction.registering: kind expense/income", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.TransactionRegistering,
            params: { kind: "expense" },
          },
          "pt_BR",
        ),
      ).toBe("Registrando gasto…");
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.TransactionRegistering,
            params: { kind: "income" },
          },
          "pt_BR",
        ),
      ).toBe("Registrando receita…");
    });

    it("transactions.registering: inclui count", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.TransactionsRegistering,
            params: { count: 3 },
          },
          "pt_BR",
        ),
      ).toBe("Registrando 3 transações…");
    });

    it("captions estáticos (sem params)", () => {
      expect(
        translateCaption(
          { key: ToolCaptionKey.CreditPurchaseRegistering, params: {} },
          "pt_BR",
        ),
      ).toBe("Registrando compra no cartão…");
      expect(
        translateCaption(
          { key: ToolCaptionKey.TransferRegistering, params: {} },
          "pt_BR",
        ),
      ).toBe("Transferindo entre contas…");
      expect(
        translateCaption(
          { key: ToolCaptionKey.InvoicePaying, params: {} },
          "pt_BR",
        ),
      ).toBe("Pagando fatura do cartão…");
      expect(
        translateCaption(
          { key: ToolCaptionKey.InvoiceMarkingPaid, params: {} },
          "pt_BR",
        ),
      ).toBe("Marcando fatura como paga…");
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.InstallmentPurchaseCanceling,
            params: {},
          },
          "pt_BR",
        ),
      ).toBe("Cancelando compra parcelada…");
    });

    it("credit_purchases.registering: inclui count", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.CreditPurchasesRegistering,
            params: { count: 5 },
          },
          "pt_BR",
        ),
      ).toBe("Registrando 5 compras no cartão…");
    });
  });

  describe("en_US", () => {
    it("installment_purchase.registering: inclui count", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.InstallmentPurchaseRegistering,
            params: { count: 4 },
          },
          "en_US",
        ),
      ).toBe("Recording 4x purchase…");
    });

    it("installment_purchase.registering: com description", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.InstallmentPurchaseRegistering,
            params: { count: 4, description: "PS5" },
          },
          "en_US",
        ),
      ).toBe("Recording 4x purchase (PS5)…");
    });

    it("transaction.registering: kind expense/income", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.TransactionRegistering,
            params: { kind: "expense" },
          },
          "en_US",
        ),
      ).toBe("Recording expense…");
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.TransactionRegistering,
            params: { kind: "income" },
          },
          "en_US",
        ),
      ).toBe("Recording income…");
    });

    it("transactions.registering: inclui count", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.TransactionsRegistering,
            params: { count: 3 },
          },
          "en_US",
        ),
      ).toBe("Recording 3 transactions…");
    });

    it("captions estáticos", () => {
      expect(
        translateCaption(
          { key: ToolCaptionKey.CreditPurchaseRegistering, params: {} },
          "en_US",
        ),
      ).toBe("Recording card purchase…");
      expect(
        translateCaption(
          { key: ToolCaptionKey.TransferRegistering, params: {} },
          "en_US",
        ),
      ).toBe("Transferring between accounts…");
      expect(
        translateCaption(
          { key: ToolCaptionKey.InvoicePaying, params: {} },
          "en_US",
        ),
      ).toBe("Paying credit card invoice…");
      expect(
        translateCaption(
          { key: ToolCaptionKey.InvoiceMarkingPaid, params: {} },
          "en_US",
        ),
      ).toBe("Marking invoice as paid…");
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.InstallmentPurchaseCanceling,
            params: {},
          },
          "en_US",
        ),
      ).toBe("Canceling installment purchase…");
    });

    it("credit_purchases.registering: inclui count", () => {
      expect(
        translateCaption(
          {
            key: ToolCaptionKey.CreditPurchasesRegistering,
            params: { count: 5 },
          },
          "en_US",
        ),
      ).toBe("Recording 5 card purchases…");
    });
  });
});
