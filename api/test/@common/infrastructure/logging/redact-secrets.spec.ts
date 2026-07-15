import { redactSecrets } from '~/@common/infrastructure/logging/redact-secrets';

describe('redactSecrets', () => {
  it('replaces password field with a placeholder', () => {
    const result = redactSecrets({ email: 'a@b.c', password: 'plaintext' });
    expect(result).toEqual({ email: 'a@b.c', password: '***' });
  });

  it('replaces hash field with a placeholder', () => {
    const result = redactSecrets({
      userId: 'u1',
      hash: '$argon2id$v=19$m=19456,t=2,p=1$abc$def',
    });
    expect(result).toEqual({ userId: 'u1', hash: '***' });
  });

  it('replaces access token entirely (never useful for correlation)', () => {
    const result = redactSecrets({
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
    });
    expect(result).toEqual({ accessToken: '***' });
  });

  it('keeps only the last 6 chars of refresh token for correlation', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.abc123';
    const result = redactSecrets({ refreshToken: jwt }) as {
      refreshToken: string;
    };
    expect(result.refreshToken).toBe('***abc123');
    expect(result.refreshToken).not.toContain(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    );
  });

  it('handles snake_case variants (refresh_token, access_token)', () => {
    const result = redactSecrets({
      access_token: 'sensitive.access.jwt',
      refresh_token: 'aaaaaaaaaaaaaaaaaa.refresh.tailXX',
    });
    expect(result).toEqual({
      access_token: '***',
      refresh_token: '***tailXX',
    });
  });

  it('masks the refresh_token_hash entirely (stored representation)', () => {
    const result = redactSecrets({
      refresh_token_hash: 'a'.repeat(64),
    });
    expect(result).toEqual({ refresh_token_hash: '***' });
  });

  it('masks the Authorization header value', () => {
    const result = redactSecrets({
      authorization: 'Bearer eyJhbGciOiJIUzI1NiI.payload.sig',
    });
    expect(result).toEqual({ authorization: '***' });
  });

  it('masks the raw Cookie header value', () => {
    const result = redactSecrets({
      cookie: 'refresh_token=abc; other=xyz',
    });
    expect(result).toEqual({ cookie: '***' });
  });

  it('renders "***" for short refresh tokens (<=6 chars) to avoid leaking >60% of the secret', () => {
    const result = redactSecrets({ refreshToken: 'short' });
    expect(result).toEqual({ refreshToken: '***' });
  });

  it('recurses into nested objects', () => {
    const result = redactSecrets({
      user: { id: 'u1', name: 'Alice' },
      credentials: { password: 'plaintext', hint: 'my dog' },
    });
    expect(result).toEqual({
      user: { id: 'u1', name: 'Alice' },
      credentials: { password: '***', hint: 'my dog' },
    });
  });

  it('recurses into arrays', () => {
    const result = redactSecrets([
      { password: 'a', name: 'first' },
      { password: 'b', name: 'second' },
    ]);
    expect(result).toEqual([
      { password: '***', name: 'first' },
      { password: '***', name: 'second' },
    ]);
  });

  it('preserves primitives untouched', () => {
    expect(redactSecrets(42)).toBe(42);
    expect(redactSecrets('hello')).toBe('hello');
    expect(redactSecrets(null)).toBeNull();
    expect(redactSecrets(undefined)).toBeUndefined();
    expect(redactSecrets(true)).toBe(true);
  });

  it('does not mutate the input object', () => {
    const original = { password: 'plaintext', email: 'a@b.c' };
    const snapshot = { ...original };
    redactSecrets(original);
    expect(original).toEqual(snapshot);
  });

  it('is case-sensitive on field names — Password (capitalized) is not detected', () => {
    // Design choice: audit consumers should use standard names.
    // Uppercase variants are edge cases and would need explicit addition
    // to the sensitive set.
    const result = redactSecrets({ Password: 'plaintext' });
    expect(result).toEqual({ Password: 'plaintext' });
  });
});
