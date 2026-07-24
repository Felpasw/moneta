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
  nickname: string | null;
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
  updateNickname(id: string, nickname: string): Promise<{ nickname: string }>;
  markOnboarded(id: string, onboardedAt: Date): Promise<{ onboardedAt: Date }>;
}
