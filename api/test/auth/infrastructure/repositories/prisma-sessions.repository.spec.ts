import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { PrismaSessionsRepository } from '~/auth/infrastructure/repositories/prisma-sessions.repository';

const NOW = new Date('2026-07-15T12:00:00Z');
const EXPIRES = new Date('2026-08-14T12:00:00Z');

const CREATED_SESSION = {
  id: 'session-1',
  userId: 'user-1',
  refreshTokenHash: 'hash',
  userAgent: 'jest',
  ip: '127.0.0.1',
  expiresAt: EXPIRES,
  revokedAt: null,
  createdAt: NOW,
};

const makePrisma = (createImpl: jest.Mock): PrismaService =>
  ({ session: { create: createImpl } }) as unknown as PrismaService;

describe('PrismaSessionsRepository', () => {
  it('creates a session and returns a domain snapshot', async () => {
    const create = jest.fn().mockResolvedValue(CREATED_SESSION);
    const repo = new PrismaSessionsRepository(makePrisma(create));

    const result = await repo.create({
      userId: 'user-1',
      refreshTokenHash: 'hash',
      userAgent: 'jest',
      ip: '127.0.0.1',
      expiresAt: EXPIRES,
    });

    expect(result).toEqual({
      id: 'session-1',
      userId: 'user-1',
      createdAt: NOW,
      expiresAt: EXPIRES,
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        refreshTokenHash: 'hash',
        userAgent: 'jest',
        ip: '127.0.0.1',
        expiresAt: EXPIRES,
      },
    });
  });

  it('accepts optional userAgent and ip as undefined', async () => {
    const create = jest.fn().mockResolvedValue({
      ...CREATED_SESSION,
      userAgent: null,
      ip: null,
    });
    const repo = new PrismaSessionsRepository(makePrisma(create));

    await repo.create({
      userId: 'user-1',
      refreshTokenHash: 'hash',
      expiresAt: EXPIRES,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        refreshTokenHash: 'hash',
        userAgent: undefined,
        ip: undefined,
        expiresAt: EXPIRES,
      },
    });
  });
});
