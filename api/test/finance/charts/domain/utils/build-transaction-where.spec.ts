import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

import { buildTransactionWhere } from '~/finance/charts/domain/utils/build-transaction-where';

const USER_ID = '11111111-1111-1111-1111-111111111111';

describe('buildTransactionWhere', () => {
  it('always includes userId in the where clause', () => {
    const where = buildTransactionWhere({ userId: USER_ID });
    expect(where.userId).toBe(USER_ID);
  });

  it('ignores userId hijack attempts (userId comes from the argument, not spread)', () => {
    const where = buildTransactionWhere({
      userId: USER_ID,
      categoryIds: ['22222222-2222-2222-2222-222222222222'],
    });
    expect(where.userId).toBe(USER_ID);
  });

  it('translates dateRange into an occurredAt gte/lte range', () => {
    const from = new Date('2026-06-01T00:00:00.000Z');
    const to = new Date('2026-06-30T23:59:59.999Z');
    const where = buildTransactionWhere({
      userId: USER_ID,
      dateRange: { from, to },
    });
    expect(where.occurredAt).toEqual({ gte: from, lte: to });
  });

  it('omits occurredAt when dateRange is undefined', () => {
    const where = buildTransactionWhere({ userId: USER_ID });
    expect(where.occurredAt).toBeUndefined();
  });

  it('translates transactionTypes into a type IN clause', () => {
    const where = buildTransactionWhere({
      userId: USER_ID,
      transactionTypes: [TransactionType.Expense],
    });
    expect(where.type).toEqual({ in: [TransactionType.Expense] });
  });

  it('translates categoryIds into a categoryId IN clause', () => {
    const ids = ['22222222-2222-2222-2222-222222222222'];
    const where = buildTransactionWhere({ userId: USER_ID, categoryIds: ids });
    expect(where.categoryId).toEqual({ in: ids });
  });

  it('translates accountIds into an accountId IN clause', () => {
    const ids = ['33333333-3333-3333-3333-333333333333'];
    const where = buildTransactionWhere({ userId: USER_ID, accountIds: ids });
    expect(where.accountId).toEqual({ in: ids });
  });

  it('translates bankIds into an account.bankId IN clause via relation filter', () => {
    const ids = ['44444444-4444-4444-4444-444444444444'];
    const where = buildTransactionWhere({ userId: USER_ID, bankIds: ids });
    expect(where.account).toEqual({ bankId: { in: ids } });
  });

  it('composes multiple filters together', () => {
    const from = new Date('2026-06-01T00:00:00.000Z');
    const to = new Date('2026-06-30T23:59:59.999Z');
    const where = buildTransactionWhere({
      userId: USER_ID,
      dateRange: { from, to },
      transactionTypes: [TransactionType.Expense, TransactionType.Income],
      categoryIds: ['22222222-2222-2222-2222-222222222222'],
      bankIds: ['44444444-4444-4444-4444-444444444444'],
    });
    expect(where).toMatchObject({
      userId: USER_ID,
      occurredAt: { gte: from, lte: to },
      type: { in: [TransactionType.Expense, TransactionType.Income] },
      categoryId: { in: ['22222222-2222-2222-2222-222222222222'] },
      account: { bankId: { in: ['44444444-4444-4444-4444-444444444444'] } },
    });
  });
});
