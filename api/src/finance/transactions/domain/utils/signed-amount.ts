import { TransactionType } from '../constants/transaction-type';

export const signedAmount = (type: TransactionType, amount: number): number => {
  if (type === TransactionType.Expense) return 0 - amount;
  return amount;
};
