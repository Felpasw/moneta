import { SignupWithPasswordUseCase } from '~/auth/application/use-cases/signup-with-password.use-case';
import { InvalidNameError } from '~/auth/domain/errors/invalid-name.error';
import { EmailAlreadyRegisteredError } from '~/users/domain/errors/email-already-registered.error';
import type { CreateUserWithPasswordCredentialInput } from '~/users/domain/ports/users-repository';

const buildUseCase = () => {
  const hasher = {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    verify: jest.fn(),
  };
  const repo = {
    createWithPasswordCredential: jest
      .fn()
      .mockImplementation((input: CreateUserWithPasswordCredentialInput) =>
        Promise.resolve({
          id: 'user-1',
          email: input.email,
          name: input.name,
        }),
      ),
    findByEmailWithPasswordCredential: jest.fn(),
  };
  const useCase = new SignupWithPasswordUseCase(hasher, repo);
  return { useCase, hasher, repo };
};

describe('SignupWithPasswordUseCase', () => {
  it('creates a user with hashed credential on the happy path', async () => {
    const { useCase, hasher, repo } = buildUseCase();
    const result = await useCase.execute({
      email: 'Alice@Example.com',
      password: 'plaintext-password',
      name: '  Alice Smith  ',
    });

    expect(hasher.hash).toHaveBeenCalledWith('plaintext-password');
    expect(repo.createWithPasswordCredential).toHaveBeenCalledWith({
      email: 'alice@example.com',
      name: 'Alice Smith',
      passwordHash: 'hashed-password',
    });
    expect(result).toEqual({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice Smith',
    });
  });

  it('rejects an empty name after trim', async () => {
    const { useCase } = buildUseCase();
    await expect(
      useCase.execute({
        email: 'alice@example.com',
        password: 'p',
        name: '   ',
      }),
    ).rejects.toThrow(InvalidNameError);
  });

  it('rejects a name longer than 100 characters', async () => {
    const { useCase } = buildUseCase();
    await expect(
      useCase.execute({
        email: 'alice@example.com',
        password: 'p',
        name: 'a'.repeat(101),
      }),
    ).rejects.toThrow(InvalidNameError);
  });

  it('accepts a name at exactly the 100-character boundary', async () => {
    const { useCase } = buildUseCase();
    await expect(
      useCase.execute({
        email: 'alice@example.com',
        password: 'p',
        name: 'a'.repeat(100),
      }),
    ).resolves.toMatchObject({ email: 'alice@example.com' });
  });

  it('rejects a name containing HTML tags', async () => {
    const { useCase } = buildUseCase();
    await expect(
      useCase.execute({
        email: 'alice@example.com',
        password: 'p',
        name: 'Alice <script>alert(1)</script>',
      }),
    ).rejects.toThrow(InvalidNameError);
  });

  it('propagates EmailAlreadyRegisteredError from the repository', async () => {
    const { useCase, repo } = buildUseCase();
    repo.createWithPasswordCredential.mockRejectedValue(
      new EmailAlreadyRegisteredError('alice@example.com'),
    );
    await expect(
      useCase.execute({
        email: 'alice@example.com',
        password: 'p',
        name: 'Alice',
      }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });

  it('does not call the hasher when name validation fails', async () => {
    const { useCase, hasher } = buildUseCase();
    await expect(
      useCase.execute({
        email: 'alice@example.com',
        password: 'p',
        name: '',
      }),
    ).rejects.toThrow(InvalidNameError);
    expect(hasher.hash).not.toHaveBeenCalled();
  });
});
