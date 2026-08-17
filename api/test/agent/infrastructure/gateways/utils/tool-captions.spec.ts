import {
  ToolCaptionKey,
  ToolName,
  resolveToolCaption,
} from '~/agent/infrastructure/gateways/utils/tool-captions';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

describe('resolveToolCaption', () => {
  it('add_installment_purchase: retorna chave + params com count', () => {
    expect(
      resolveToolCaption(ToolName.AddInstallmentPurchase, {
        installmentsCount: 4,
      }),
    ).toEqual({
      key: ToolCaptionKey.InstallmentPurchaseRegistering,
      params: { count: 4 },
    });
  });

  it('add_installment_purchase: inclui description quando presente', () => {
    expect(
      resolveToolCaption(ToolName.AddInstallmentPurchase, {
        installmentsCount: 4,
        description: 'PS5',
      }),
    ).toEqual({
      key: ToolCaptionKey.InstallmentPurchaseRegistering,
      params: { count: 4, description: 'PS5' },
    });
  });

  it('add_transaction expense: retorna kind=expense', () => {
    expect(
      resolveToolCaption(ToolName.AddTransaction, {
        type: TransactionType.Expense,
      }),
    ).toEqual({
      key: ToolCaptionKey.TransactionRegistering,
      params: { kind: TransactionType.Expense },
    });
  });

  it('add_transaction income: retorna kind=income', () => {
    expect(
      resolveToolCaption(ToolName.AddTransaction, {
        type: TransactionType.Income,
      }),
    ).toEqual({
      key: ToolCaptionKey.TransactionRegistering,
      params: { kind: TransactionType.Income },
    });
  });

  it('add_transactions: retorna count do batch', () => {
    expect(
      resolveToolCaption(ToolName.AddTransactions, {
        transactions: [{}, {}, {}],
      }),
    ).toEqual({
      key: ToolCaptionKey.TransactionsRegistering,
      params: { count: 3 },
    });
  });

  it('add_credit_purchase: retorna caption sem params', () => {
    expect(resolveToolCaption(ToolName.AddCreditPurchase, {})).toEqual({
      key: ToolCaptionKey.CreditPurchaseRegistering,
      params: {},
    });
  });

  it('add_credit_purchases: retorna count do batch', () => {
    expect(
      resolveToolCaption(ToolName.AddCreditPurchases, {
        purchases: [{}, {}],
      }),
    ).toEqual({
      key: ToolCaptionKey.CreditPurchasesRegistering,
      params: { count: 2 },
    });
  });

  it('create_transfer: retorna caption', () => {
    expect(resolveToolCaption(ToolName.CreateTransfer, {})).toEqual({
      key: ToolCaptionKey.TransferRegistering,
      params: {},
    });
  });

  it('pay_invoice: retorna caption', () => {
    expect(resolveToolCaption(ToolName.PayInvoice, {})).toEqual({
      key: ToolCaptionKey.InvoicePaying,
      params: {},
    });
  });

  it('mark_invoice_paid: retorna caption', () => {
    expect(resolveToolCaption(ToolName.MarkInvoicePaid, {})).toEqual({
      key: ToolCaptionKey.InvoiceMarkingPaid,
      params: {},
    });
  });

  it('cancel_installment_purchase: retorna caption', () => {
    expect(resolveToolCaption(ToolName.CancelInstallmentPurchase, {})).toEqual({
      key: ToolCaptionKey.InstallmentPurchaseCanceling,
      params: {},
    });
  });

  it('list_my_accounts: retorna caption de leitura', () => {
    expect(resolveToolCaption(ToolName.ListMyAccounts, {})).toEqual({
      key: ToolCaptionKey.AccountsFetching,
      params: {},
    });
  });

  it('list_banks: retorna caption de leitura', () => {
    expect(resolveToolCaption(ToolName.ListBanks, {})).toEqual({
      key: ToolCaptionKey.BanksFetching,
      params: {},
    });
  });

  it('get_current_invoice: retorna caption de leitura', () => {
    expect(resolveToolCaption(ToolName.GetCurrentInvoice, {})).toEqual({
      key: ToolCaptionKey.CurrentInvoiceFetching,
      params: {},
    });
  });

  it('list_invoices: retorna caption de leitura', () => {
    expect(resolveToolCaption(ToolName.ListInvoices, {})).toEqual({
      key: ToolCaptionKey.InvoicesFetching,
      params: {},
    });
  });

  it('list_categories: retorna caption de leitura', () => {
    expect(resolveToolCaption(ToolName.ListCategories, {})).toEqual({
      key: ToolCaptionKey.CategoriesFetching,
      params: {},
    });
  });

  it('list_transactions: retorna caption de leitura', () => {
    expect(resolveToolCaption(ToolName.ListTransactions, {})).toEqual({
      key: ToolCaptionKey.TransactionsFetching,
      params: {},
    });
  });

  it('list_transfers: retorna caption de leitura', () => {
    expect(resolveToolCaption(ToolName.ListTransfers, {})).toEqual({
      key: ToolCaptionKey.TransfersFetching,
      params: {},
    });
  });

  it('add_bank_account: retorna caption', () => {
    expect(resolveToolCaption(ToolName.AddBankAccount, {})).toEqual({
      key: ToolCaptionKey.BankAccountAdding,
      params: {},
    });
  });

  it('update_bank_account: retorna caption', () => {
    expect(resolveToolCaption(ToolName.UpdateBankAccount, {})).toEqual({
      key: ToolCaptionKey.BankAccountUpdating,
      params: {},
    });
  });

  it('delete_bank_account: retorna caption', () => {
    expect(resolveToolCaption(ToolName.DeleteBankAccount, {})).toEqual({
      key: ToolCaptionKey.BankAccountDeleting,
      params: {},
    });
  });

  it('set_balance: retorna caption', () => {
    expect(resolveToolCaption(ToolName.SetBalance, {})).toEqual({
      key: ToolCaptionKey.BalanceSetting,
      params: {},
    });
  });

  it('set_account_balances: retorna count do batch', () => {
    expect(
      resolveToolCaption(ToolName.SetAccountBalances, {
        balances: [{}, {}, {}],
      }),
    ).toEqual({
      key: ToolCaptionKey.AccountBalancesSetting,
      params: { count: 3 },
    });
  });

  it('add_category: retorna caption', () => {
    expect(resolveToolCaption(ToolName.AddCategory, {})).toEqual({
      key: ToolCaptionKey.CategoryAdding,
      params: {},
    });
  });

  it('update_category: retorna caption', () => {
    expect(resolveToolCaption(ToolName.UpdateCategory, {})).toEqual({
      key: ToolCaptionKey.CategoryUpdating,
      params: {},
    });
  });

  it('delete_category: retorna caption', () => {
    expect(resolveToolCaption(ToolName.DeleteCategory, {})).toEqual({
      key: ToolCaptionKey.CategoryDeleting,
      params: {},
    });
  });

  it('edit_transaction: retorna caption', () => {
    expect(resolveToolCaption(ToolName.EditTransaction, {})).toEqual({
      key: ToolCaptionKey.TransactionEditing,
      params: {},
    });
  });

  it('edit_transactions: retorna count do batch', () => {
    expect(
      resolveToolCaption(ToolName.EditTransactions, {
        edits: [{}, {}],
      }),
    ).toEqual({
      key: ToolCaptionKey.TransactionsEditing,
      params: { count: 2 },
    });
  });

  it('delete_transaction: retorna caption', () => {
    expect(resolveToolCaption(ToolName.DeleteTransaction, {})).toEqual({
      key: ToolCaptionKey.TransactionDeleting,
      params: {},
    });
  });

  it('delete_transfer: retorna caption', () => {
    expect(resolveToolCaption(ToolName.DeleteTransfer, {})).toEqual({
      key: ToolCaptionKey.TransferDeleting,
      params: {},
    });
  });

  it('set_nickname: retorna caption', () => {
    expect(resolveToolCaption(ToolName.SetNickname, {})).toEqual({
      key: ToolCaptionKey.NicknameSetting,
      params: {},
    });
  });

  it('add_user_banks: retorna count do batch', () => {
    expect(
      resolveToolCaption(ToolName.AddUserBanks, {
        bankIds: ['a', 'b', 'c', 'd'],
      }),
    ).toEqual({
      key: ToolCaptionKey.UserBanksAdding,
      params: { count: 4 },
    });
  });

  it('configure_account_details: retorna caption', () => {
    expect(resolveToolCaption(ToolName.ConfigureAccountDetails, {})).toEqual({
      key: ToolCaptionKey.AccountDetailsConfiguring,
      params: {},
    });
  });

  it('finish_setup: retorna caption', () => {
    expect(resolveToolCaption(ToolName.FinishSetup, {})).toEqual({
      key: ToolCaptionKey.SetupFinishing,
      params: {},
    });
  });

  it('complete_onboarding: retorna caption', () => {
    expect(resolveToolCaption(ToolName.CompleteOnboarding, {})).toEqual({
      key: ToolCaptionKey.OnboardingCompleting,
      params: {},
    });
  });

  it('tool desconhecida: retorna undefined', () => {
    expect(resolveToolCaption('unknown_tool', {})).toBeUndefined();
  });
});
