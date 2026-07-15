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

const makePrisma = (createImpl: jest.Mock): PrismaService =>
  ({ user: { create: createImpl } }) as unknown as PrismaService;

describe('PrismaUsersRepository', () => {
  it('returns a UserSnapshot from the created user on success', async () => {
    const create = jest.fn().mockResolvedValue(CREATED_USER);
    const repo = new PrismaUsersRepository(makePrisma(create));

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
    const repo = new PrismaUsersRepository(makePrisma(create));

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
    const repo = new PrismaUsersRepository(makePrisma(create));

    await expect(
      repo.createWithPasswordCredential({
        email: 'alice@example.com',
        name: 'Alice',
        passwordHash: 'hashed',
      }),
    ).rejects.toBe(err);
  });
});
