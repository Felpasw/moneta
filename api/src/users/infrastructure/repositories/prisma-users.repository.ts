import { Injectable } from '@nestjs/common';
import { CredentialType, Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { EmailAlreadyRegisteredError } from '../../domain/errors/email-already-registered.error';
import type {
  CreateUserWithPasswordCredentialInput,
  UserSnapshot,
  UsersRepository,
} from '../../domain/ports/users-repository';

const UNIQUE_CONSTRAINT_CODE = 'P2002';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithPasswordCredential(
    input: CreateUserWithPasswordCredentialInput,
  ): Promise<UserSnapshot> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          credentials: {
            create: { type: CredentialType.password, hash: input.passwordHash },
          },
        },
      });
      return { id: user.id, email: user.email, name: user.name };
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
}
