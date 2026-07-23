import { Injectable } from '@nestjs/common';
import { CredentialType, Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { EmailAlreadyRegisteredError } from '../../domain/errors/email-already-registered.error';
import type {
  CreateUserWithPasswordCredentialInput,
  UserSnapshot,
  UsersRepository,
  UserWithPasswordCredential,
} from '../../domain/ports/users-repository';

const UNIQUE_CONSTRAINT_CODE = 'P2002';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithPasswordCredential(
    input: CreateUserWithPasswordCredentialInput,
  ): Promise<UserSnapshot> {
    try {
      return await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          credentials: {
            create: { type: CredentialType.password, hash: input.passwordHash },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          onboardedAt: true,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === UNIQUE_CONSTRAINT_CODE
      ) {
        throw new EmailAlreadyRegisteredError(input.email);
      }
      throw e;
    }
  }

  async findById(id: string): Promise<UserSnapshot | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        onboardedAt: true,
      },
    });
  }

  async findByEmail(email: string): Promise<UserSnapshot | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        onboardedAt: true,
      },
    });
  }

  async updateNickname(
    id: string,
    nickname: string,
  ): Promise<{ nickname: string }> {
    return this.prisma.user.update({
      where: { id },
      data: { nickname },
      select: { nickname: true },
    });
  }

  async markOnboarded(
    id: string,
    onboardedAt: Date,
  ): Promise<{ onboardedAt: Date }> {
    const row = await this.prisma.user.update({
      where: { id },
      data: { onboardedAt },
      select: { onboardedAt: true },
    });
    return { onboardedAt: row.onboardedAt! };
  }

  async findByEmailWithPasswordCredential(
    email: string,
  ): Promise<UserWithPasswordCredential | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        onboardedAt: true,
        credentials: {
          where: { type: CredentialType.password },
          select: { hash: true },
          take: 1,
        },
      },
    });
    if (!user || user.credentials.length === 0) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      onboardedAt: user.onboardedAt,
      passwordHash: user.credentials[0].hash,
    };
  }
}
