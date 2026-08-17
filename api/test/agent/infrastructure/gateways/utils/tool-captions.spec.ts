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

  it('tool desconhecida: retorna undefined', () => {
    expect(resolveToolCaption('unknown_tool', {})).toBeUndefined();
  });
});
