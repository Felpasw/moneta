import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { AddInstallmentPurchaseUseCase } from '~/finance/card-billing/installments/application/use-cases/add-installment-purchase.use-case';
import { InstallmentPurchaseNotAllowedError } from '~/finance/card-billing/installments/domain/errors/installment-purchase-not-allowed.error';
import { InvalidInstallmentsCountError } from '~/finance/card-billing/installments/domain/errors/invalid-installments-count.error';
import { InvalidInstallmentAmountsError } from '~/finance/card-billing/installments/domain/errors/invalid-installment-amounts.error';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

const USER_ID = 'user-1';
const CARD_ID = 'card-1';
const DEBIT_ID = 'debit-1';
const OCCURRED_AT = new Date('2026-07-15T12:00:00Z');

const cardAccount = {
  id: CARD_ID,
  userId: USER_ID,
  bankId: 'b-1',
  nickname: 'Nubank',
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 10,
  dueDay: 20,
};

const debitAccount = {
  ...cardAccount,
  id: DEBIT_ID,
  creditLimit: null,
  closeDay: null,
  dueDay: null,
};

const buildUseCase = () => {
  const groups = { createGroupWithInstallments: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const cycle = { resolveInvoiceForDate: jest.fn() };
  const useCase = new AddInstallmentPurchaseUseCase(
    groups,
    getAccount as never,
    cycle as never,
  );
  return { useCase, groups, getAccount, cycle };
};

const BASE_INPUT = {
  userId: USER_ID,
  accountId: CARD_ID,
  totalAmount: 4800,
  installmentsCount: 12,
  description: 'PS5',
  occurredAt: OCCURRED_AT,
};

describe('AddInstallmentPurchaseUseCase', () => {
  it('materializes N parcelas with invoice resolved per date and passes to repo atomically', async () => {
    const { useCase, groups, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    cycle.resolveInvoiceForDate.mockImplementation((args: { date: Date }) =>
      Promise.resolve({ id: `inv-${args.date.toISOString().slice(0, 7)}` }),
    );
    groups.createGroupWithInstallments.mockResolvedValue({
      group: { id: 'grp-1' },
      transactions: [],
    });

    await useCase.execute(BASE_INPUT);

    expect(cycle.resolveInvoiceForDate).toHaveBeenCalledTimes(12);
    expect(groups.createGroupWithInstallments).toHaveBeenCalledTimes(1);
    const [call] = groups.createGroupWithInstallments.mock
      .calls[0] as unknown as [
      {
        group: {
          userId: string;
          accountId: string;
          categoryId?: string;
          totalAmount: number;
          installmentsCount: number;
          installmentAmount: number;
          description: string;
          purchaseDate: Date;
        };
        installments: Array<{
          userId: string;
          accountId: string;
          type: TransactionType;
          amount: number;
          description: string;
          occurredAt: Date;
          invoiceId: string;
          installmentNumber: number;
        }>;
      },
    ];
    expect(call.group.installmentsCount).toBe(12);
    expect(call.group.totalAmount).toBe(4800);
    expect(call.group.installmentAmount).toBe(400);
    expect(call.installments).toHaveLength(12);
    expect(call.installments[0]).toMatchObject({
      installmentNumber: 1,
      amount: 400,
      description: 'PS5 (1/12)',
      occurredAt: new Date(Date.UTC(2026, 6, 15, 12)),
      type: TransactionType.Expense,
    });
    expect(call.installments[11]).toMatchObject({
      installmentNumber: 12,
      amount: 400,
      description: 'PS5 (12/12)',
      occurredAt: new Date(Date.UTC(2027, 5, 15, 12)),
    });
  });

  it('accepts installmentAmount instead of totalAmount and derives the total', async () => {
    const { useCase, groups, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    cycle.resolveInvoiceForDate.mockResolvedValue({ id: 'inv-x' });
    groups.createGroupWithInstallments.mockResolvedValue({
      group: {},
      transactions: [],
    });

    await useCase.execute({
      userId: USER_ID,
      accountId: CARD_ID,
      installmentAmount: 250,
      installmentsCount: 6,
      description: 'Moto G',
      occurredAt: OCCURRED_AT,
    });

    const [call] = groups.createGroupWithInstallments.mock
      .calls[0] as unknown as [
      {
        group: {
          totalAmount: number;
          installmentAmount: number;
          installmentsCount: number;
        };
        installments: Array<{ amount: number }>;
      },
    ];
    expect(call.group.totalAmount).toBe(1500);
    expect(call.group.installmentAmount).toBe(250);
    expect(call.installments.every((i) => i.amount === 250)).toBe(true);
  });

  it('distributes rounding remainder to the last parcela (totalAmount not evenly divisible)', async () => {
    const { useCase, groups, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    cycle.resolveInvoiceForDate.mockResolvedValue({ id: 'inv-x' });
    groups.createGroupWithInstallments.mockResolvedValue({
      group: {},
      transactions: [],
    });

    // 100.03 / 3 = 33.343... → each = 33.34 (floor to cent), remainder 0.01 on last
    // parcelas: 33.34, 33.34, 33.35 — sum = 100.03
    await useCase.execute({
      userId: USER_ID,
      accountId: CARD_ID,
      totalAmount: 100.03,
      installmentsCount: 3,
      description: 'Odd split',
      occurredAt: OCCURRED_AT,
    });

    const [call] = groups.createGroupWithInstallments.mock
      .calls[0] as unknown as [
      {
        group: { installmentAmount: number; totalAmount: number };
        installments: Array<{ amount: number; installmentNumber: number }>;
      },
    ];
    expect(call.installments[0].amount).toBeCloseTo(33.34, 2);
    expect(call.installments[1].amount).toBeCloseTo(33.34, 2);
    expect(call.installments[2].amount).toBeCloseTo(33.35, 2);
    const sum = call.installments.reduce((acc, i) => acc + i.amount, 0);
    expect(sum).toBeCloseTo(100.03, 2);
    // installmentAmount stored on the group is the "regular" parcel value (before residue)
    expect(call.group.installmentAmount).toBeCloseTo(33.34, 2);
  });

  it('rejects when installmentsCount < 2', async () => {
    const { useCase, groups } = buildUseCase();

    await expect(
      useCase.execute({
        ...BASE_INPUT,
        installmentsCount: 1,
      }),
    ).rejects.toBeInstanceOf(InvalidInstallmentsCountError);
    expect(groups.createGroupWithInstallments).not.toHaveBeenCalled();
  });

  it('rejects when neither totalAmount nor installmentAmount is provided', async () => {
    const { useCase, groups } = buildUseCase();

    await expect(
      useCase.execute({
        userId: USER_ID,
        accountId: CARD_ID,
        installmentsCount: 6,
        description: 'nada',
        occurredAt: OCCURRED_AT,
      }),
    ).rejects.toBeInstanceOf(InvalidInstallmentAmountsError);
    expect(groups.createGroupWithInstallments).not.toHaveBeenCalled();
  });

  it('rejects the purchase on debit account (only cards can be installmentized)', async () => {
    const { useCase, groups, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(debitAccount);

    await expect(
      useCase.execute({ ...BASE_INPUT, accountId: DEBIT_ID }),
    ).rejects.toBeInstanceOf(InstallmentPurchaseNotAllowedError);
    expect(groups.createGroupWithInstallments).not.toHaveBeenCalled();
  });

  it('throws AccountNotFoundError when the account is missing or unowned', async () => {
    const { useCase, groups, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(null);

    await expect(
      useCase.execute({ ...BASE_INPUT, accountId: 'ghost' }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
    expect(groups.createGroupWithInstallments).not.toHaveBeenCalled();
  });
});
