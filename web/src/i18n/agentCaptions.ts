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
  [ToolCaptionKey.BankAccountAdding]: Record<string, never>;
  [ToolCaptionKey.BankAccountUpdating]: Record<string, never>;
  [ToolCaptionKey.BankAccountDeleting]: Record<string, never>;
  [ToolCaptionKey.BalanceSetting]: Record<string, never>;
  [ToolCaptionKey.AccountBalancesSetting]: { count: number };
  [ToolCaptionKey.CategoryAdding]: Record<string, never>;
  [ToolCaptionKey.CategoryUpdating]: Record<string, never>;
  [ToolCaptionKey.CategoryDeleting]: Record<string, never>;
  [ToolCaptionKey.TransactionEditing]: Record<string, never>;
  [ToolCaptionKey.TransactionsEditing]: { count: number };
  [ToolCaptionKey.TransactionDeleting]: Record<string, never>;
  [ToolCaptionKey.TransferDeleting]: Record<string, never>;
  [ToolCaptionKey.NicknameSetting]: Record<string, never>;
  [ToolCaptionKey.UserBanksAdding]: { count: number };
  [ToolCaptionKey.AccountDetailsConfiguring]: Record<string, never>;
  [ToolCaptionKey.SetupFinishing]: Record<string, never>;
  [ToolCaptionKey.OnboardingCompleting]: Record<string, never>;
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
  [ToolCaptionKey.BankAccountAdding]: () => "Adicionando conta…",
  [ToolCaptionKey.BankAccountUpdating]: () => "Atualizando conta…",
  [ToolCaptionKey.BankAccountDeleting]: () => "Removendo conta…",
  [ToolCaptionKey.BalanceSetting]: () => "Ajustando saldo…",
  [ToolCaptionKey.AccountBalancesSetting]: (p) =>
    `Ajustando saldo de ${p.count} contas…`,
  [ToolCaptionKey.CategoryAdding]: () => "Adicionando categoria…",
  [ToolCaptionKey.CategoryUpdating]: () => "Atualizando categoria…",
  [ToolCaptionKey.CategoryDeleting]: () => "Removendo categoria…",
  [ToolCaptionKey.TransactionEditing]: () => "Editando transação…",
  [ToolCaptionKey.TransactionsEditing]: (p) =>
    `Editando ${p.count} transações…`,
  [ToolCaptionKey.TransactionDeleting]: () => "Removendo transação…",
  [ToolCaptionKey.TransferDeleting]: () => "Removendo transferência…",
  [ToolCaptionKey.NicknameSetting]: () => "Salvando apelido…",
  [ToolCaptionKey.UserBanksAdding]: (p) => `Adicionando ${p.count} bancos…`,
  [ToolCaptionKey.AccountDetailsConfiguring]: () => "Configurando conta…",
  [ToolCaptionKey.SetupFinishing]: () => "Finalizando configuração…",
  [ToolCaptionKey.OnboardingCompleting]: () => "Concluindo onboarding…",
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
  [ToolCaptionKey.BankAccountAdding]: () => "Adding account…",
  [ToolCaptionKey.BankAccountUpdating]: () => "Updating account…",
  [ToolCaptionKey.BankAccountDeleting]: () => "Removing account…",
  [ToolCaptionKey.BalanceSetting]: () => "Setting balance…",
  [ToolCaptionKey.AccountBalancesSetting]: (p) =>
    `Setting balance of ${p.count} accounts…`,
  [ToolCaptionKey.CategoryAdding]: () => "Adding category…",
  [ToolCaptionKey.CategoryUpdating]: () => "Updating category…",
  [ToolCaptionKey.CategoryDeleting]: () => "Removing category…",
  [ToolCaptionKey.TransactionEditing]: () => "Editing transaction…",
  [ToolCaptionKey.TransactionsEditing]: (p) =>
    `Editing ${p.count} transactions…`,
  [ToolCaptionKey.TransactionDeleting]: () => "Removing transaction…",
  [ToolCaptionKey.TransferDeleting]: () => "Removing transfer…",
  [ToolCaptionKey.NicknameSetting]: () => "Saving nickname…",
  [ToolCaptionKey.UserBanksAdding]: (p) => `Adding ${p.count} banks…`,
  [ToolCaptionKey.AccountDetailsConfiguring]: () => "Configuring account…",
  [ToolCaptionKey.SetupFinishing]: () => "Finalizing setup…",
  [ToolCaptionKey.OnboardingCompleting]: () => "Completing onboarding…",
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
