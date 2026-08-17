import {
  ToolName,
  resolveToolResources,
} from '~/agent/infrastructure/gateways/utils/tool-resources';

describe('resolveToolResources', () => {
  describe('tools de escrita — invalidam recursos', () => {
    it('add_transaction: accounts + transactions + dashboard', () => {
      expect(resolveToolResources(ToolName.AddTransaction)).toEqual([
        'accounts',
        'transactions',
        'dashboard',
      ]);
    });

    it('add_transactions (batch): mesmo shape', () => {
      expect(resolveToolResources(ToolName.AddTransactions)).toEqual([
        'accounts',
        'transactions',
        'dashboard',
      ]);
    });

    it('edit_transaction / edit_transactions / delete_transaction: mesmo shape', () => {
      const expected = ['accounts', 'transactions', 'dashboard'];
      expect(resolveToolResources(ToolName.EditTransaction)).toEqual(expected);
      expect(resolveToolResources(ToolName.EditTransactions)).toEqual(expected);
      expect(resolveToolResources(ToolName.DeleteTransaction)).toEqual(
        expected,
      );
    });

    it('add_credit_purchase / add_credit_purchases: mesmo shape (invoice tá dentro de accounts)', () => {
      const expected = ['accounts', 'transactions', 'dashboard'];
      expect(resolveToolResources(ToolName.AddCreditPurchase)).toEqual(
        expected,
      );
      expect(resolveToolResources(ToolName.AddCreditPurchases)).toEqual(
        expected,
      );
    });

    it('add_installment_purchase / cancel_installment_purchase: mesmo shape', () => {
      const expected = ['accounts', 'transactions', 'dashboard'];
      expect(resolveToolResources(ToolName.AddInstallmentPurchase)).toEqual(
        expected,
      );
      expect(resolveToolResources(ToolName.CancelInstallmentPurchase)).toEqual(
        expected,
      );
    });

    it('pay_invoice / mark_invoice_paid: mesmo shape', () => {
      const expected = ['accounts', 'transactions', 'dashboard'];
      expect(resolveToolResources(ToolName.PayInvoice)).toEqual(expected);
      expect(resolveToolResources(ToolName.MarkInvoicePaid)).toEqual(expected);
    });

    it('create_transfer / delete_transfer: mesmo shape', () => {
      const expected = ['accounts', 'transactions', 'dashboard'];
      expect(resolveToolResources(ToolName.CreateTransfer)).toEqual(expected);
      expect(resolveToolResources(ToolName.DeleteTransfer)).toEqual(expected);
    });

    it('bank account CRUD: accounts + dashboard', () => {
      const expected = ['accounts', 'dashboard'];
      expect(resolveToolResources(ToolName.AddBankAccount)).toEqual(expected);
      expect(resolveToolResources(ToolName.UpdateBankAccount)).toEqual(
        expected,
      );
      expect(resolveToolResources(ToolName.DeleteBankAccount)).toEqual(
        expected,
      );
    });

    it('set_balance / set_account_balances: accounts + dashboard', () => {
      const expected = ['accounts', 'dashboard'];
      expect(resolveToolResources(ToolName.SetBalance)).toEqual(expected);
      expect(resolveToolResources(ToolName.SetAccountBalances)).toEqual(
        expected,
      );
    });

    it('add_category / update_category: só categories', () => {
      expect(resolveToolResources(ToolName.AddCategory)).toEqual([
        'categories',
      ]);
      expect(resolveToolResources(ToolName.UpdateCategory)).toEqual([
        'categories',
      ]);
    });

    it('delete_category: categories + transactions (transactions podem referenciar)', () => {
      expect(resolveToolResources(ToolName.DeleteCategory)).toEqual([
        'categories',
        'transactions',
      ]);
    });

    it('set_nickname: só agent', () => {
      expect(resolveToolResources(ToolName.SetNickname)).toEqual(['agent']);
    });

    it('add_user_banks / configure_account_details: accounts + dashboard', () => {
      const expected = ['accounts', 'dashboard'];
      expect(resolveToolResources(ToolName.AddUserBanks)).toEqual(expected);
      expect(resolveToolResources(ToolName.ConfigureAccountDetails)).toEqual(
        expected,
      );
    });

    it('finish_setup / complete_onboarding: accounts + dashboard + auth', () => {
      const expected = ['accounts', 'dashboard', 'auth'];
      expect(resolveToolResources(ToolName.FinishSetup)).toEqual(expected);
      expect(resolveToolResources(ToolName.CompleteOnboarding)).toEqual(
        expected,
      );
    });
  });

  describe('tools de leitura — set vazio (não invalidam nada)', () => {
    it.each([
      ['list_my_accounts', ToolName.ListMyAccounts],
      ['list_banks', ToolName.ListBanks],
      ['get_current_invoice', ToolName.GetCurrentInvoice],
      ['list_invoices', ToolName.ListInvoices],
      ['list_categories', ToolName.ListCategories],
      ['list_transactions', ToolName.ListTransactions],
      ['list_transfers', ToolName.ListTransfers],
    ])('%s retorna []', (_name, tool) => {
      expect(resolveToolResources(tool)).toEqual([]);
    });
  });

  describe('tool desconhecida', () => {
    it('retorna undefined (dispatcher pode ignorar sem crash)', () => {
      expect(resolveToolResources('unknown_tool')).toBeUndefined();
    });
  });
});
