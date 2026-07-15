import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { AuthAuditEventType } from '~/auth/domain/ports/auth-audit-log-repository';
import { PrismaAuthAuditLogRepository } from '~/auth/infrastructure/repositories/prisma-auth-audit-log.repository';

const makePrisma = (createImpl: jest.Mock): PrismaService =>
  ({ authAuditLog: { create: createImpl } }) as unknown as PrismaService;

describe('PrismaAuthAuditLogRepository', () => {
  it('persists a minimal event with just event type', async () => {
    const create = jest.fn().mockResolvedValue({});
    const repo = new PrismaAuthAuditLogRepository(makePrisma(create));

    await repo.record({ event: AuthAuditEventType.ALL_SESSIONS_REVOKED });

    expect(create).toHaveBeenCalledWith({
      data: {
        event: 'all_sessions_revoked',
        userId: undefined,
        ip: undefined,
        userAgent: undefined,
        context: undefined,
      },
    });
  });

  it('persists all fields when provided', async () => {
    const create = jest.fn().mockResolvedValue({});
    const repo = new PrismaAuthAuditLogRepository(makePrisma(create));

    await repo.record({
      event: AuthAuditEventType.LOGIN_SUCCESS,
      userId: 'user-1',
      ip: '127.0.0.1',
      userAgent: 'jest',
      context: { attempt: 1 },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        event: 'login_success',
        userId: 'user-1',
        ip: '127.0.0.1',
        userAgent: 'jest',
        context: { attempt: 1 },
      },
    });
  });

  it('redacts sensitive fields from context before persisting', async () => {
    const create = jest.fn().mockResolvedValue({});
    const repo = new PrismaAuthAuditLogRepository(makePrisma(create));

    await repo.record({
      event: AuthAuditEventType.LOGIN_FAILURE,
      context: {
        email: 'a@b.c',
        password: 'plaintext',
        refreshToken: 'header.body.signaturewithsuffix',
      },
    });

    const call = create.mock.calls[0] as unknown as [
      { data: { context: Record<string, string> } },
    ];
    expect(call[0].data.context.email).toBe('a@b.c');
    expect(call[0].data.context.password).toBe('***');
    expect(call[0].data.context.refreshToken).toBe('***suffix');
  });

  it('omits context when not provided', async () => {
    const create = jest.fn().mockResolvedValue({});
    const repo = new PrismaAuthAuditLogRepository(makePrisma(create));

    await repo.record({
      event: AuthAuditEventType.PASSKEY_ENROLLED,
      userId: 'user-1',
    });

    const call = create.mock.calls[0] as unknown as [
      { data: { context: unknown } },
    ];
    expect(call[0].data.context).toBeUndefined();
  });
});
