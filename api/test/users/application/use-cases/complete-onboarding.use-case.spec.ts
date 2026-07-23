import type { EventEmitter2 } from '@nestjs/event-emitter';

import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';
import type { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import type { UserBankAccount } from '~/finance/accounts/domain/ports/user-bank-accounts-repository';
import { CompleteOnboardingUseCase } from '~/users/application/use-cases/complete-onboarding.use-case';
import { USER_ONBOARDED_EVENT } from '~/users/domain/events/user-onboarded.event';
import type { UserSnapshot } from '~/users/domain/ports/users-repository';
import type { UsersService } from '~/users/users.service';

const NOW = new Date('2026-07-23T09:00:00Z');

const account = (id: string): UserBankAccount => ({
  id,
  userId: 'user-1',
  bankId: `bank-${id}`,
  nickname: 'x',
  balance: 0,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
});

const snapshot = (patch: Partial<UserSnapshot> = {}): UserSnapshot => ({
  id: 'user-1',
  email: 'a@b.com',
  name: 'Alice',
  nickname: 'Alice',
  onboardedAt: null,
  ...patch,
});

const buildUseCase = (): {
  useCase: CompleteOnboardingUseCase;
  users: { findById: jest.Mock; markOnboarded: jest.Mock };
  listAccounts: { execute: jest.Mock };
  events: { emit: jest.Mock };
  clock: FixedClock;
} => {
  const users = { findById: jest.fn(), markOnboarded: jest.fn() };
  const listAccounts = { execute: jest.fn() };
  const events = { emit: jest.fn() };
  const clock = new FixedClock(NOW);
  const useCase = new CompleteOnboardingUseCase(
    users as unknown as UsersService,
    listAccounts as unknown as ListMyAccountsUseCase,
    clock,
    events as unknown as EventEmitter2,
  );
  return { useCase, users, listAccounts, events, clock };
};

describe('CompleteOnboardingUseCase', () => {
  it('marca o user como onboarded no now do clock, emite evento e retorna ok', async () => {
    const { useCase, users, listAccounts, events } = buildUseCase();
    users.findById.mockResolvedValue(snapshot());
    listAccounts.execute.mockResolvedValue([account('acc-1')]);
    users.markOnboarded.mockResolvedValue({ onboardedAt: NOW });

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({ ok: true });
    expect(users.markOnboarded).toHaveBeenCalledWith('user-1', NOW);
    expect(events.emit).toHaveBeenCalledWith(USER_ONBOARDED_EVENT, {
      userId: 'user-1',
      onboardedAt: NOW,
    });
  });

  it('retorna ok:false + missing quando nickname está null', async () => {
    const { useCase, users, listAccounts, events } = buildUseCase();
    users.findById.mockResolvedValue(snapshot({ nickname: null }));
    listAccounts.execute.mockResolvedValue([account('acc-1')]);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({ ok: false, missing: ['nickname'] });
    expect(users.markOnboarded).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('retorna ok:false + missing quando não tem nenhuma conta', async () => {
    const { useCase, users, listAccounts, events } = buildUseCase();
    users.findById.mockResolvedValue(snapshot());
    listAccounts.execute.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({ ok: false, missing: ['banks'] });
    expect(users.markOnboarded).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('acumula todos os missing quando nickname E banks estão faltando', async () => {
    const { useCase, users, listAccounts } = buildUseCase();
    users.findById.mockResolvedValue(snapshot({ nickname: null }));
    listAccounts.execute.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({ ok: false, missing: ['nickname', 'banks'] });
  });

  it('é idempotente: se onboardedAt já está setado retorna alreadyOnboarded sem re-emitir evento', async () => {
    const { useCase, users, listAccounts, events } = buildUseCase();
    users.findById.mockResolvedValue(snapshot({ onboardedAt: NOW }));

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({ ok: true, alreadyOnboarded: true });
    expect(users.markOnboarded).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
    expect(listAccounts.execute).not.toHaveBeenCalled();
  });

  it('trata user inexistente como missing nickname + banks (defensivo)', async () => {
    const { useCase, users, listAccounts } = buildUseCase();
    users.findById.mockResolvedValue(null);
    listAccounts.execute.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'ghost' });

    expect(result).toEqual({ ok: false, missing: ['nickname', 'banks'] });
  });
});
