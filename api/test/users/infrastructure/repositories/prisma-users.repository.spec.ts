import { Prisma } from '@prisma/client';

import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { EmailAlreadyRegisteredError } from '~/users/domain/errors/email-already-registered.error';
import { PrismaUsersRepository } from '~/users/infrastructure/repositories/prisma-users.repository';

const CREATED_USER = {
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  nickname: null,
  onboardedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePrismaWithCreate = (createImpl: jest.Mock): PrismaService =>
  ({ user: { create: createImpl } }) as unknown as PrismaService;

const makePrismaWithFindUnique = (findUniqueImpl: jest.Mock): PrismaService =>
  ({ user: { findUnique: findUniqueImpl } }) as unknown as PrismaService;

describe('PrismaUsersRepository', () => {
  describe('createWithPasswordCredential', () => {
    it('returns a UserSnapshot from the created user on success', async () => {
      const create = jest.fn().mockResolvedValue(CREATED_USER);
      const repo = new PrismaUsersRepository(makePrismaWithCreate(create));

      const result = await repo.createWithPasswordCredential({
        email: 'alice@example.com',
        name: 'Alice',
        passwordHash: 'hashed',
      });

      expect(result).toEqual({
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
      });
      expect(create).toHaveBeenCalledWith({
        data: {
          email: 'alice@example.com',
          name: 'Alice',
          credentials: {
            create: { type: 'password', hash: 'hashed' },
          },
        },
      });
    });

    it('throws EmailAlreadyRegisteredError when Prisma reports P2002', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('unique violation', {
        code: 'P2002',
        clientVersion: '7.8.0',
      });
      const create = jest.fn().mockRejectedValue(err);
      const repo = new PrismaUsersRepository(makePrismaWithCreate(create));

      await expect(
        repo.createWithPasswordCredential({
          email: 'alice@example.com',
          name: 'Alice',
          passwordHash: 'hashed',
        }),
      ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
    });

    it('rethrows non-P2002 Prisma errors unchanged', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('other', {
        code: 'P9999',
        clientVersion: '7.8.0',
      });
      const create = jest.fn().mockRejectedValue(err);
      const repo = new PrismaUsersRepository(makePrismaWithCreate(create));

      await expect(
        repo.createWithPasswordCredential({
          email: 'alice@example.com',
          name: 'Alice',
          passwordHash: 'hashed',
        }),
      ).rejects.toBe(err);
    });
  });

  describe('findByEmailWithPasswordCredential', () => {
    it('returns id/email/name/passwordHash when the user has a password credential', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        credentials: [{ type: 'password', hash: 'stored-hash' }],
      });
      const repo = new PrismaUsersRepository(
        makePrismaWithFindUnique(findUnique),
      );

      const result =
        await repo.findByEmailWithPasswordCredential('alice@example.com');

      expect(result).toEqual({
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        passwordHash: 'stored-hash',
      });
      expect(findUnique).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
        include: {
          credentials: { where: { type: 'password' }, take: 1 },
        },
      });
    });

    it('returns null when the user does not exist', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const repo = new PrismaUsersRepository(
        makePrismaWithFindUnique(findUnique),
      );

      const result =
        await repo.findByEmailWithPasswordCredential('ghost@example.com');
      expect(result).toBeNull();
    });

    it('returns null when the user exists but has no password credential', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        credentials: [],
      });
      const repo = new PrismaUsersRepository(
        makePrismaWithFindUnique(findUnique),
      );

      const result =
        await repo.findByEmailWithPasswordCredential('alice@example.com');
      expect(result).toBeNull();
    });
  });
});
