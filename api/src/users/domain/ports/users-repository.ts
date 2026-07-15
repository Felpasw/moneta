export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface CreateUserWithPasswordCredentialInput {
  email: string;
  name: string;
  passwordHash: string;
}

export interface UserSnapshot {
  id: string;
  email: string;
  name: string;
}

export interface UsersRepository {
  createWithPasswordCredential(
    input: CreateUserWithPasswordCredentialInput,
  ): Promise<UserSnapshot>;
}
