import type { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import type { UserBankAccount } from '~/finance/accounts/domain/ports/user-bank-accounts-repository';
import { GetOnboardingStateUseCase } from '~/onboarding/application/use-cases/get-onboarding-state.use-case';
import type { UserSnapshot } from '~/users/domain/ports/users-repository';
import type { UsersService } from '~/users/users.service';

const snapshot = (patch: Partial<UserSnapshot> = {}): UserSnapshot => ({
  id: 'user-1',
  email: 'a@b.com',
  name: 'Alice',
  nickname: null,
  onboardedAt: null,
  ...patch,
});

const account = (): UserBankAccount => ({
  id: 'acc-1',
  userId: 'user-1',
  bankId: 'bank-1',
  nickname: 'x',
  balance: 0,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
});

const build = (): {
  useCase: GetOnboardingStateUseCase;
  users: { findById: jest.Mock };
  listAccounts: { execute: jest.Mock };
} => {
  const users = { findById: jest.fn() };
  const listAccounts = { execute: jest.fn() };
  const useCase = new GetOnboardingStateUseCase(
    users as unknown as UsersService,
    listAccounts as unknown as ListMyAccountsUseCase,
  );
  return { useCase, users, listAccounts };
};

describe('GetOnboardingStateUseCase', () => {
  it('deriva state pra user sem nickname e sem contas', async () => {
    const { useCase, users, listAccounts } = build();
    users.findById.mockResolvedValue(snapshot());
    listAccounts.execute.mockResolvedValue({ items: [], summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 } });

    const state = await useCase.execute({ userId: 'user-1' });

    expect(state).toEqual({
      needsNickname: true,
      needsBanks: true,
      completed: false,
    });
    expect(users.findById).toHaveBeenCalledWith('user-1');
    expect(listAccounts.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('deriva completed=true quando onboardedAt é setado', async () => {
    const { useCase, users, listAccounts } = build();
    users.findById.mockResolvedValue(
      snapshot({ onboardedAt: new Date('2026-01-01') }),
    );
    listAccounts.execute.mockResolvedValue({ items: [], summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 } });

    const state = await useCase.execute({ userId: 'user-1' });

    expect(state.completed).toBe(true);
  });

  it('deriva tudo false (não completed) quando tem nickname + contas', async () => {
    const { useCase, users, listAccounts } = build();
    users.findById.mockResolvedValue(snapshot({ nickname: 'Felps' }));
    listAccounts.execute.mockResolvedValue({
      items: [account()],
      summary: { totalBalance: 0, checkingCount: 1, totalOverdraft: 0 },
    });

    const state = await useCase.execute({ userId: 'user-1' });

    expect(state).toEqual({
      needsNickname: false,
      needsBanks: false,
      completed: false,
    });
  });

  it('busca user e contas em paralelo (Promise.all)', async () => {
    const { useCase, users, listAccounts } = build();
    const order: string[] = [];
    users.findById.mockImplementation(async () => {
      order.push('user-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('user-end');
      return snapshot();
    });
    listAccounts.execute.mockImplementation(async () => {
      order.push('accounts-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('accounts-end');
      return {
        items: [],
        summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
      };
    });

    await useCase.execute({ userId: 'user-1' });

    expect(order.slice(0, 2).sort()).toEqual(['accounts-start', 'user-start']);
  });
});
