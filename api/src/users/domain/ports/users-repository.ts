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
  onboardedAt: Date | null;
}

export interface UserWithPasswordCredential extends UserSnapshot {
  passwordHash: string;
}

export interface UsersRepository {
  createWithPasswordCredential(
    input: CreateUserWithPasswordCredentialInput,
  ): Promise<UserSnapshot>;
  findByEmailWithPasswordCredential(
    email: string,
  ): Promise<UserWithPasswordCredential | null>;
  findById(id: string): Promise<UserSnapshot | null>;
  findByEmail(email: string): Promise<UserSnapshot | null>;
}
