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
  ListMyAccounts = 'list_my_accounts',
  ListBanks = 'list_banks',
  GetCurrentInvoice = 'get_current_invoice',
  ListInvoices = 'list_invoices',
  ListCategories = 'list_categories',
  ListTransactions = 'list_transactions',
  ListTransfers = 'list_transfers',
  AddBankAccount = 'add_bank_account',
  UpdateBankAccount = 'update_bank_account',
  DeleteBankAccount = 'delete_bank_account',
  SetBalance = 'set_balance',
  SetAccountBalances = 'set_account_balances',
  AddCategory = 'add_category',
  UpdateCategory = 'update_category',
  DeleteCategory = 'delete_category',
  EditTransaction = 'edit_transaction',
  EditTransactions = 'edit_transactions',
  DeleteTransaction = 'delete_transaction',
  DeleteTransfer = 'delete_transfer',
  SetNickname = 'set_nickname',
  AddUserBanks = 'add_user_banks',
  ConfigureAccountDetails = 'configure_account_details',
  FinishSetup = 'finish_setup',
  CompleteOnboarding = 'complete_onboarding',
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
  AccountsFetching = 'accounts.fetching',
  BanksFetching = 'banks.fetching',
  CurrentInvoiceFetching = 'current_invoice.fetching',
  InvoicesFetching = 'invoices.fetching',
  CategoriesFetching = 'categories.fetching',
  TransactionsFetching = 'transactions.fetching',
  TransfersFetching = 'transfers.fetching',
  BankAccountAdding = 'bank_account.adding',
  BankAccountUpdating = 'bank_account.updating',
  BankAccountDeleting = 'bank_account.deleting',
  BalanceSetting = 'balance.setting',
  AccountBalancesSetting = 'account_balances.setting',
  CategoryAdding = 'category.adding',
  CategoryUpdating = 'category.updating',
  CategoryDeleting = 'category.deleting',
  TransactionEditing = 'transaction.editing',
  TransactionsEditing = 'transactions.editing',
  TransactionDeleting = 'transaction.deleting',
  TransferDeleting = 'transfer.deleting',
  NicknameSetting = 'nickname.setting',
  UserBanksAdding = 'user_banks.adding',
  AccountDetailsConfiguring = 'account_details.configuring',
  SetupFinishing = 'setup.finishing',
  OnboardingCompleting = 'onboarding.completing',
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
type EditBatchArgs = { edits: unknown[] };
type BalancesBatchArgs = { balances: unknown[] };
type UserBanksArgs = { bankIds: unknown[] };
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
  [ToolName.ListMyAccounts]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.ListBanks]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.GetCurrentInvoice]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.ListInvoices]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.ListCategories]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.ListTransactions]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.ListTransfers]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.AddBankAccount]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.UpdateBankAccount]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.DeleteBankAccount]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.SetBalance]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.SetAccountBalances]: {
    args: BalancesBatchArgs;
    caption: ToolCaption<{ count: number }>;
  };
  [ToolName.AddCategory]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.UpdateCategory]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.DeleteCategory]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.EditTransaction]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.EditTransactions]: {
    args: EditBatchArgs;
    caption: ToolCaption<{ count: number }>;
  };
  [ToolName.DeleteTransaction]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.DeleteTransfer]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.SetNickname]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.AddUserBanks]: {
    args: UserBanksArgs;
    caption: ToolCaption<{ count: number }>;
  };
  [ToolName.ConfigureAccountDetails]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.FinishSetup]: {
    args: unknown;
    caption: ToolCaption<EmptyParams>;
  };
  [ToolName.CompleteOnboarding]: {
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
  [ToolName.ListMyAccounts]: () => ({
    key: ToolCaptionKey.AccountsFetching,
    params: {},
  }),
  [ToolName.ListBanks]: () => ({
    key: ToolCaptionKey.BanksFetching,
    params: {},
  }),
  [ToolName.GetCurrentInvoice]: () => ({
    key: ToolCaptionKey.CurrentInvoiceFetching,
    params: {},
  }),
  [ToolName.ListInvoices]: () => ({
    key: ToolCaptionKey.InvoicesFetching,
    params: {},
  }),
  [ToolName.ListCategories]: () => ({
    key: ToolCaptionKey.CategoriesFetching,
    params: {},
  }),
  [ToolName.ListTransactions]: () => ({
    key: ToolCaptionKey.TransactionsFetching,
    params: {},
  }),
  [ToolName.ListTransfers]: () => ({
    key: ToolCaptionKey.TransfersFetching,
    params: {},
  }),
  [ToolName.AddBankAccount]: () => ({
    key: ToolCaptionKey.BankAccountAdding,
    params: {},
  }),
  [ToolName.UpdateBankAccount]: () => ({
    key: ToolCaptionKey.BankAccountUpdating,
    params: {},
  }),
  [ToolName.DeleteBankAccount]: () => ({
    key: ToolCaptionKey.BankAccountDeleting,
    params: {},
  }),
  [ToolName.SetBalance]: () => ({
    key: ToolCaptionKey.BalanceSetting,
    params: {},
  }),
  [ToolName.SetAccountBalances]: (a) => ({
    key: ToolCaptionKey.AccountBalancesSetting,
    params: { count: a.balances.length },
  }),
  [ToolName.AddCategory]: () => ({
    key: ToolCaptionKey.CategoryAdding,
    params: {},
  }),
  [ToolName.UpdateCategory]: () => ({
    key: ToolCaptionKey.CategoryUpdating,
    params: {},
  }),
  [ToolName.DeleteCategory]: () => ({
    key: ToolCaptionKey.CategoryDeleting,
    params: {},
  }),
  [ToolName.EditTransaction]: () => ({
    key: ToolCaptionKey.TransactionEditing,
    params: {},
  }),
  [ToolName.EditTransactions]: (a) => ({
    key: ToolCaptionKey.TransactionsEditing,
    params: { count: a.edits.length },
  }),
  [ToolName.DeleteTransaction]: () => ({
    key: ToolCaptionKey.TransactionDeleting,
    params: {},
  }),
  [ToolName.DeleteTransfer]: () => ({
    key: ToolCaptionKey.TransferDeleting,
    params: {},
  }),
  [ToolName.SetNickname]: () => ({
    key: ToolCaptionKey.NicknameSetting,
    params: {},
  }),
  [ToolName.AddUserBanks]: (a) => ({
    key: ToolCaptionKey.UserBanksAdding,
    params: { count: a.bankIds.length },
  }),
  [ToolName.ConfigureAccountDetails]: () => ({
    key: ToolCaptionKey.AccountDetailsConfiguring,
    params: {},
  }),
  [ToolName.FinishSetup]: () => ({
    key: ToolCaptionKey.SetupFinishing,
    params: {},
  }),
  [ToolName.CompleteOnboarding]: () => ({
    key: ToolCaptionKey.OnboardingCompleting,
    params: {},
  }),
};

export const resolveToolCaption = (
  toolName: string,
  args: unknown,
): ToolCaption | undefined => {
  const resolver = RESOLVERS[toolName as ToolName] as
    ((a: unknown) => ToolCaption) | undefined;
  return resolver?.(args);
};
