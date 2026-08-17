import { ToolCaptionKey } from "@/hooks/constants/useAgentSession.constants";
import type { ToolCaption } from "@/hooks/interfaces/useAgentSession.interface";
import type { OutputLanguage } from "@/services/interfaces/assistantProfile.interface";

type ParamsOf<K extends ToolCaptionKey> = {
  [ToolCaptionKey.InstallmentPurchaseRegistering]: {
    count: number;
    description?: string;
  };
  [ToolCaptionKey.TransactionRegistering]: { kind: "expense" | "income" };
  [ToolCaptionKey.TransactionsRegistering]: { count: number };
  [ToolCaptionKey.CreditPurchaseRegistering]: Record<string, never>;
  [ToolCaptionKey.CreditPurchasesRegistering]: { count: number };
  [ToolCaptionKey.TransferRegistering]: Record<string, never>;
  [ToolCaptionKey.InvoicePaying]: Record<string, never>;
  [ToolCaptionKey.InvoiceMarkingPaid]: Record<string, never>;
  [ToolCaptionKey.InstallmentPurchaseCanceling]: Record<string, never>;
  [ToolCaptionKey.AccountsFetching]: Record<string, never>;
  [ToolCaptionKey.BanksFetching]: Record<string, never>;
  [ToolCaptionKey.CurrentInvoiceFetching]: Record<string, never>;
  [ToolCaptionKey.InvoicesFetching]: Record<string, never>;
  [ToolCaptionKey.CategoriesFetching]: Record<string, never>;
  [ToolCaptionKey.TransactionsFetching]: Record<string, never>;
  [ToolCaptionKey.TransfersFetching]: Record<string, never>;
}[K];

type Locale = {
  [K in ToolCaptionKey]: (params: ParamsOf<K>) => string;
};

const PT_BR: Locale = {
  [ToolCaptionKey.InstallmentPurchaseRegistering]: (p) =>
    p.description
      ? `Registrando compra em ${p.count}x (${p.description})…`
      : `Registrando compra em ${p.count}x…`,
  [ToolCaptionKey.TransactionRegistering]: (p) =>
    p.kind === "income" ? "Registrando receita…" : "Registrando gasto…",
  [ToolCaptionKey.TransactionsRegistering]: (p) =>
    `Registrando ${p.count} transações…`,
  [ToolCaptionKey.CreditPurchaseRegistering]: () =>
    "Registrando compra no cartão…",
  [ToolCaptionKey.CreditPurchasesRegistering]: (p) =>
    `Registrando ${p.count} compras no cartão…`,
  [ToolCaptionKey.TransferRegistering]: () => "Transferindo entre contas…",
  [ToolCaptionKey.InvoicePaying]: () => "Pagando fatura do cartão…",
  [ToolCaptionKey.InvoiceMarkingPaid]: () => "Marcando fatura como paga…",
  [ToolCaptionKey.InstallmentPurchaseCanceling]: () =>
    "Cancelando compra parcelada…",
  [ToolCaptionKey.AccountsFetching]: () => "Consultando contas…",
  [ToolCaptionKey.BanksFetching]: () => "Consultando bancos…",
  [ToolCaptionKey.CurrentInvoiceFetching]: () => "Consultando fatura atual…",
  [ToolCaptionKey.InvoicesFetching]: () => "Consultando faturas…",
  [ToolCaptionKey.CategoriesFetching]: () => "Consultando categorias…",
  [ToolCaptionKey.TransactionsFetching]: () => "Consultando transações…",
  [ToolCaptionKey.TransfersFetching]: () => "Consultando transferências…",
};

const EN_US: Locale = {
  [ToolCaptionKey.InstallmentPurchaseRegistering]: (p) =>
    p.description
      ? `Recording ${p.count}x purchase (${p.description})…`
      : `Recording ${p.count}x purchase…`,
  [ToolCaptionKey.TransactionRegistering]: (p) =>
    p.kind === "income" ? "Recording income…" : "Recording expense…",
  [ToolCaptionKey.TransactionsRegistering]: (p) =>
    `Recording ${p.count} transactions…`,
  [ToolCaptionKey.CreditPurchaseRegistering]: () => "Recording card purchase…",
  [ToolCaptionKey.CreditPurchasesRegistering]: (p) =>
    `Recording ${p.count} card purchases…`,
  [ToolCaptionKey.TransferRegistering]: () => "Transferring between accounts…",
  [ToolCaptionKey.InvoicePaying]: () => "Paying credit card invoice…",
  [ToolCaptionKey.InvoiceMarkingPaid]: () => "Marking invoice as paid…",
  [ToolCaptionKey.InstallmentPurchaseCanceling]: () =>
    "Canceling installment purchase…",
  [ToolCaptionKey.AccountsFetching]: () => "Fetching accounts…",
  [ToolCaptionKey.BanksFetching]: () => "Fetching banks…",
  [ToolCaptionKey.CurrentInvoiceFetching]: () => "Fetching current invoice…",
  [ToolCaptionKey.InvoicesFetching]: () => "Fetching invoices…",
  [ToolCaptionKey.CategoriesFetching]: () => "Fetching categories…",
  [ToolCaptionKey.TransactionsFetching]: () => "Fetching transactions…",
  [ToolCaptionKey.TransfersFetching]: () => "Fetching transfers…",
};

const LOCALES: Record<OutputLanguage, Locale> = {
  pt_BR: PT_BR,
  en_US: EN_US,
};

export function translateCaption(
  caption: ToolCaption,
  language: OutputLanguage,
): string {
  const locale = LOCALES[language];
  const translate = locale[caption.key] as (params: unknown) => string;
  return translate(caption.params);
}
