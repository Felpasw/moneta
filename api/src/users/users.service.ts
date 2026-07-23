import { Inject, Injectable } from '@nestjs/common';

import {
  USERS_REPOSITORY,
  type UserSnapshot,
  type UsersRepository,
} from './domain/ports/users-repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
  ) {}

  async findById(id: string): Promise<UserSnapshot | null> {
    return this.users.findById(id);
  }
}
