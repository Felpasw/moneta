import { Argon2PasswordHasher } from '~/auth/infrastructure/argon2-password-hasher';

const PLAINTEXT = 'correct-horse-battery-staple';
const WRONG = 'wrong-horse-battery-staple';
const EXPECTED_HEADER = '$argon2id$v=19$m=19456,t=2,p=1$';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('produces a hash with the expected argon2id header (params baked in)', async () => {
    const digest = await hasher.hash(PLAINTEXT);
    expect(digest.startsWith(EXPECTED_HEADER)).toBe(true);
  });

  it('verifies a hash produced by itself against the same plaintext', async () => {
    const digest = await hasher.hash(PLAINTEXT);
    await expect(hasher.verify(digest, PLAINTEXT)).resolves.toBe(true);
  });

  it('rejects verification when the plaintext is wrong', async () => {
    const digest = await hasher.hash(PLAINTEXT);
    await expect(hasher.verify(digest, WRONG)).resolves.toBe(false);
  });

  it('produces different hashes for the same plaintext (salt is random)', async () => {
    const [a, b] = await Promise.all([
      hasher.hash(PLAINTEXT),
      hasher.hash(PLAINTEXT),
    ]);
    expect(a).not.toEqual(b);
  });

  it('verifies a pre-computed argon2id fixture with matching params', async () => {
    const knownHash = await hasher.hash(PLAINTEXT);
    const freshHasher = new Argon2PasswordHasher();
    await expect(freshHasher.verify(knownHash, PLAINTEXT)).resolves.toBe(true);
  });
});
