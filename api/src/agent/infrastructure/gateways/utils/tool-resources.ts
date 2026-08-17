import { ToolName } from './tool-captions';

export { ToolName };

type ResourceList = readonly string[];

const TX_RESOURCES: ResourceList = ['accounts', 'transactions', 'dashboard'];
const ACCOUNT_RESOURCES: ResourceList = ['accounts', 'dashboard'];
const CATEGORY_RESOURCES: ResourceList = ['categories'];
const ONBOARDING_RESOURCES: ResourceList = ['accounts', 'dashboard', 'auth'];
const EMPTY: ResourceList = [];

const TOOL_RESOURCES: Record<ToolName, ResourceList> = {
  [ToolName.AddTransaction]: TX_RESOURCES,
  [ToolName.AddTransactions]: TX_RESOURCES,
  [ToolName.EditTransaction]: TX_RESOURCES,
  [ToolName.EditTransactions]: TX_RESOURCES,
  [ToolName.DeleteTransaction]: TX_RESOURCES,
  [ToolName.AddCreditPurchase]: TX_RESOURCES,
  [ToolName.AddCreditPurchases]: TX_RESOURCES,
  [ToolName.AddInstallmentPurchase]: TX_RESOURCES,
  [ToolName.CancelInstallmentPurchase]: TX_RESOURCES,
  [ToolName.PayInvoice]: TX_RESOURCES,
  [ToolName.MarkInvoicePaid]: TX_RESOURCES,
  [ToolName.CreateTransfer]: TX_RESOURCES,
  [ToolName.DeleteTransfer]: TX_RESOURCES,
  [ToolName.AddBankAccount]: ACCOUNT_RESOURCES,
  [ToolName.UpdateBankAccount]: ACCOUNT_RESOURCES,
  [ToolName.DeleteBankAccount]: ACCOUNT_RESOURCES,
  [ToolName.SetBalance]: ACCOUNT_RESOURCES,
  [ToolName.SetAccountBalances]: ACCOUNT_RESOURCES,
  [ToolName.AddUserBanks]: ACCOUNT_RESOURCES,
  [ToolName.ConfigureAccountDetails]: ACCOUNT_RESOURCES,
  [ToolName.AddCategory]: CATEGORY_RESOURCES,
  [ToolName.UpdateCategory]: CATEGORY_RESOURCES,
  [ToolName.DeleteCategory]: ['categories', 'transactions'],
  [ToolName.SetNickname]: ['agent'],
  [ToolName.FinishSetup]: ONBOARDING_RESOURCES,
  [ToolName.CompleteOnboarding]: ONBOARDING_RESOURCES,
  [ToolName.ListMyAccounts]: EMPTY,
  [ToolName.ListBanks]: EMPTY,
  [ToolName.GetCurrentInvoice]: EMPTY,
  [ToolName.ListInvoices]: EMPTY,
  [ToolName.ListCategories]: EMPTY,
  [ToolName.ListTransactions]: EMPTY,
  [ToolName.ListTransfers]: EMPTY,
};

export const resolveToolResources = (
  toolName: string,
): ResourceList | undefined => {
  return TOOL_RESOURCES[toolName as ToolName];
};
