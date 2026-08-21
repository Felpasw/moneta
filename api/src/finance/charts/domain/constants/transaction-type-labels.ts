import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.Expense]: 'Expense',
  [TransactionType.Income]: 'Income',
};
