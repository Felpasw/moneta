import type { UserBankAccount } from '~/finance/accounts/domain/ports/user-bank-accounts-repository';
import { deriveOnboardingState } from '~/onboarding/domain/utils/derive-onboarding-state';
import type { UserSnapshot } from '~/users/domain/ports/users-repository';

const snapshot = (patch: Partial<UserSnapshot> = {}): UserSnapshot => ({
  id: 'user-1',
  email: 'a@b.com',
  name: 'Alice',
  nickname: null,
  onboardedAt: null,
  ...patch,
});

const account = (id = 'acc-1'): UserBankAccount => ({
  id,
  userId: 'user-1',
  bankId: 'bank-1',
  nickname: 'x',
  balance: 0,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
});

describe('deriveOnboardingState()', () => {
  it('user novo sem nickname e sem contas', () => {
    const state = deriveOnboardingState({ user: snapshot(), accounts: [] });
    expect(state).toEqual({
      needsNickname: true,
      needsBanks: true,
      completed: false,
    });
  });

  it('com nickname mas sem contas — só needsBanks true', () => {
    const state = deriveOnboardingState({
      user: snapshot({ nickname: 'Felps' }),
      accounts: [],
    });
    expect(state).toEqual({
      needsNickname: false,
      needsBanks: true,
      completed: false,
    });
  });

  it('com nickname + contas — tudo false, mas ainda não completed', () => {
    const state = deriveOnboardingState({
      user: snapshot({ nickname: 'Felps' }),
      accounts: [account('a1'), account('a2')],
    });
    expect(state).toEqual({
      needsNickname: false,
      needsBanks: false,
      completed: false,
    });
  });

  it('onboardedAt setado — completed true, tudo mais false independente', () => {
    const state = deriveOnboardingState({
      user: snapshot({
        nickname: null,
        onboardedAt: new Date('2026-01-01T00:00:00Z'),
      }),
      accounts: [],
    });
    expect(state).toEqual({
      needsNickname: false,
      needsBanks: false,
      completed: true,
    });
  });

  it('user null (não encontrado) — needsNickname + needsBanks, sem completed', () => {
    const state = deriveOnboardingState({ user: null, accounts: [] });
    expect(state).toEqual({
      needsNickname: true,
      needsBanks: true,
      completed: false,
    });
  });
});
