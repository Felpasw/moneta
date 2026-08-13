import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

export enum ToolName {
  AddInstallmentPurchase = 'add_installment_purchase',
  AddTransaction = 'add_transaction',
  AddTransactions = 'add_transactions',
  AddCreditPurchase = 'add_credit_purchase',
  AddCreditPurchases = 'add_credit_purchases',
  CreateTransfer = 'create_transfer',
  PayInvoice = 'pay_invoice',
  MarkInvoicePaid = 'mark_invoice_paid',
  CancelInstallmentPurchase = 'cancel_installment_purchase',
}

export enum ToolCaptionKey {
  InstallmentPurchaseRegistering = 'installment_purchase.registering',
  TransactionRegistering = 'transaction.registering',
  TransactionsRegistering = 'transactions.registering',
  CreditPurchaseRegistering = 'credit_purchase.registering',
  CreditPurchasesRegistering = 'credit_purchases.registering',
  TransferRegistering = 'transfer.registering',
  InvoicePaying = 'invoice.paying',
  InvoiceMarkingPaid = 'invoice.marking_paid',
  InstallmentPurchaseCanceling = 'installment_purchase.canceling',
}

export interface ToolCaption<P = Record<string, unknown>> {
  readonly key: ToolCaptionKey;
  readonly params: P;
}

type InstallmentPurchaseArgs = {
  installmentsCount: number;
  description?: string;
};
type TransactionArgs = { type: TransactionType };
type BatchTxArgs = { transactions: unknown[] };
type BatchPurchaseArgs = { purchases: unknown[] };
type EmptyParams = Record<string, never>;

type ToolCaptionMap = {
  [ToolName.AddInstallmentPurchase]: {
    args: InstallmentPurchaseArgs;
    caption: ToolCaption<{ count: number; description?: string }>;
  };
  [ToolName.AddTransaction]: {
    args: TransactionArgs;
    caption: ToolCaption<{ kind: TransactionType }>;
  };
  [ToolName.AddTransactions]: {
    args: BatchTxArgs;
    caption: ToolCaption<{ count: number }>;
  };
  [ToolName.AddCreditPurchase]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.AddCreditPurchases]: {
    args: BatchPurchaseArgs;
    caption: ToolCaption<{ count: number }>;
  };
  [ToolName.CreateTransfer]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.PayInvoice]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.MarkInvoicePaid]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.CancelInstallmentPurchase]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
};

type Resolvers = {
  [K in keyof ToolCaptionMap]: (
    args: ToolCaptionMap[K]['args'],
  ) => ToolCaptionMap[K]['caption'];
};

const RESOLVERS: Resolvers = {
  [ToolName.AddInstallmentPurchase]: (a) => ({
    key: ToolCaptionKey.InstallmentPurchaseRegistering,
    params: a.description
      ? { count: a.installmentsCount, description: a.description }
      : { count: a.installmentsCount },
  }),
  [ToolName.AddTransaction]: (a) => ({
    key: ToolCaptionKey.TransactionRegistering,
    params: { kind: a.type },
  }),
  [ToolName.AddTransactions]: (a) => ({
    key: ToolCaptionKey.TransactionsRegistering,
    params: { count: a.transactions.length },
  }),
  [ToolName.AddCreditPurchase]: () => ({
    key: ToolCaptionKey.CreditPurchaseRegistering,
    params: {},
  }),
  [ToolName.AddCreditPurchases]: (a) => ({
    key: ToolCaptionKey.CreditPurchasesRegistering,
    params: { count: a.purchases.length },
  }),
  [ToolName.CreateTransfer]: () => ({
    key: ToolCaptionKey.TransferRegistering,
    params: {},
  }),
  [ToolName.PayInvoice]: () => ({
    key: ToolCaptionKey.InvoicePaying,
    params: {},
  }),
  [ToolName.MarkInvoicePaid]: () => ({
    key: ToolCaptionKey.InvoiceMarkingPaid,
    params: {},
  }),
  [ToolName.CancelInstallmentPurchase]: () => ({
    key: ToolCaptionKey.InstallmentPurchaseCanceling,
    params: {},
  }),
};

export const resolveToolCaption = (
  toolName: string,
  args: unknown,
): ToolCaption | undefined => {
  const resolver = RESOLVERS[toolName as ToolName] as
    | ((a: unknown) => ToolCaption)
    | undefined;
  return resolver?.(args);
};
