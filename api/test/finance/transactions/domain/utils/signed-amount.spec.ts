import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { signedAmount } from '~/finance/transactions/domain/utils/signed-amount';

describe('signedAmount', () => {
  it('returns a negative value for expenses', () => {
    expect(signedAmount(TransactionType.Expense, 100)).toBe(-100);
  });

  it('returns a positive value for incomes', () => {
    expect(signedAmount(TransactionType.Income, 250.5)).toBe(250.5);
  });

  it('handles zero amount consistently', () => {
    expect(signedAmount(TransactionType.Expense, 0)).toBe(0);
    expect(signedAmount(TransactionType.Income, 0)).toBe(0);
  });
});
