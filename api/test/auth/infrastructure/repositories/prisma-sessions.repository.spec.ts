import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { PrismaSessionsRepository } from '~/auth/infrastructure/repositories/prisma-sessions.repository';

const NOW = new Date('2026-07-15T12:00:00Z');
const EXPIRES = new Date('2026-08-14T12:00:00Z');
const NEW_EXPIRES = new Date('2026-09-13T12:00:00Z');

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

const makePrisma = (methods: {
  create?: jest.Mock;
  findUnique?: jest.Mock;
  update?: jest.Mock;
  transaction?: jest.Mock;
}): PrismaService =>
  ({
    session: {
      create: methods.create,
      findUnique: methods.findUnique,
      update: methods.update,
    },
    $transaction: methods.transaction,
  }) as unknown as PrismaService;

describe('PrismaSessionsRepository', () => {
  describe('create', () => {
    it('creates a session and returns a domain snapshot', async () => {
      const create = jest.fn().mockResolvedValue(CREATED_SESSION);
      const repo = new PrismaSessionsRepository(makePrisma({ create }));

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
      const repo = new PrismaSessionsRepository(makePrisma({ create }));

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

  describe('findByRefreshTokenHash', () => {
    it('returns session + user snapshot when hash matches', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: EXPIRES,
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          name: 'Alice',
        },
      });
      const repo = new PrismaSessionsRepository(makePrisma({ findUnique }));

      const result = await repo.findByRefreshTokenHash('abcdef');

      expect(result).toEqual({
        id: 'session-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: EXPIRES,
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          name: 'Alice',
        },
      });
      expect(findUnique).toHaveBeenCalledWith({
        where: { refreshTokenHash: 'abcdef' },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
    });

    it('returns null when no session matches the hash', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const repo = new PrismaSessionsRepository(makePrisma({ findUnique }));

      const result = await repo.findByRefreshTokenHash('unknown');
      expect(result).toBeNull();
    });
  });

  describe('rotate', () => {
    it('revokes the previous session and creates the new one atomically', async () => {
      const update = jest.fn().mockResolvedValue({});
      const create = jest.fn().mockResolvedValue({
        id: 'session-new',
        userId: 'user-1',
        refreshTokenHash: 'new-hash',
        userAgent: 'jest',
        ip: '127.0.0.1',
        expiresAt: NEW_EXPIRES,
        revokedAt: null,
        createdAt: NOW,
      });
      const transaction = jest
        .fn()
        .mockImplementation(
          async (callback: (tx: unknown) => Promise<unknown>) =>
            callback({
              session: { update, create },
            }),
        );
      const repo = new PrismaSessionsRepository(makePrisma({ transaction }));

      const result = await repo.rotate({
        previousSessionId: 'session-old',
        next: {
          userId: 'user-1',
          refreshTokenHash: 'new-hash',
          userAgent: 'jest',
          ip: '127.0.0.1',
          expiresAt: NEW_EXPIRES,
        },
        now: NOW,
      });

      expect(update).toHaveBeenCalledWith({
        where: { id: 'session-old' },
        data: { revokedAt: NOW },
      });
      expect(create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          refreshTokenHash: 'new-hash',
          userAgent: 'jest',
          ip: '127.0.0.1',
          expiresAt: NEW_EXPIRES,
        },
      });
      expect(result).toEqual({
        id: 'session-new',
        userId: 'user-1',
        createdAt: NOW,
        expiresAt: NEW_EXPIRES,
      });
    });
  });
});
