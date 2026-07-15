import { Inject, Injectable } from '@nestjs/common';

import {
  USERS_REPOSITORY,
  type UserSnapshot,
  type UsersRepository,
} from '../../../users/domain/ports/users-repository';
import {
  HTML_TAG_PATTERN,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
} from '../../domain/constants/name';
import { InvalidNameError } from '../../domain/errors/invalid-name.error';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../domain/services/password-hasher';
import type { SignupWithPasswordInput } from '../types/signup';

@Injectable()
export class SignupWithPasswordUseCase {
  constructor(
    @Inject(PASSWORD_HASHER)
    private readonly hasher: PasswordHasher,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(input: SignupWithPasswordInput): Promise<UserSnapshot> {
    const name = input.name.trim();
    if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
      throw new InvalidNameError(
        `Name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters`,
      );
    }
    if (HTML_TAG_PATTERN.test(name)) {
      throw new InvalidNameError('Name must not contain HTML tags');
    }

    const email = input.email.toLowerCase().trim();
    const passwordHash = await this.hasher.hash(input.password);

    return this.usersRepository.createWithPasswordCredential({
      email,
      name,
      passwordHash,
    });
  }
}
