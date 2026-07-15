import { ConfigService } from '@nestjs/config';

import { env } from '~/config/env';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';

const ACCESS_SECRET = 'access-secret-only-for-tests';
const REFRESH_SECRET = 'refresh-secret-only-for-tests';

const makeConfig = (values: Partial<Record<string, string>>): ConfigService =>
  ({
    getOrThrow: <T>(key: string): T => {
      const value = values[key];
      if (value === undefined) {
        throw new Error(`${key} is not configured`);
      }
      return value as T;
    },
  }) as unknown as ConfigService;

const buildService = (overrides: Partial<Record<string, string>> = {}) => {
  const values = {
    [env.JWT_ACCESS_SECRET]: ACCESS_SECRET,
    [env.JWT_REFRESH_SECRET]: REFRESH_SECRET,
    ...overrides,
  };
  return new JwtTokenService(makeConfig(values));
};

describe('JwtTokenService', () => {
  it('round-trips an access token — sign then verify returns the payload', () => {
    const service = buildService();
    const token = service.signAccess({ sub: 'user-123' });
    const decoded = service.verifyAccess(token);
    expect(decoded.sub).toBe('user-123');
  });

  it('round-trips a refresh token — sign then verify returns the payload', () => {
    const service = buildService();
    const token = service.signRefresh({ sub: 'user-123' });
    const decoded = service.verifyRefresh(token);
    expect(decoded.sub).toBe('user-123');
  });

  it('rejects an access token when the signing secret does not match', () => {
    const signer = buildService();
    const verifier = buildService({
      [env.JWT_ACCESS_SECRET]: 'different-secret',
    });
    const token = signer.signAccess({ sub: 'user-123' });
    expect(() => verifier.verifyAccess(token)).toThrow();
  });

  it('refuses to verify a refresh token with the access secret and vice-versa', () => {
    const service = buildService();
    const access = service.signAccess({ sub: 'user-123' });
    const refresh = service.signRefresh({ sub: 'user-123' });
    expect(() => service.verifyRefresh(access)).toThrow();
    expect(() => service.verifyAccess(refresh)).toThrow();
  });

  it('bakes the expected TTLs into the token (access ~15m, refresh ~30d)', () => {
    const service = buildService();
    const access = service.signAccess({ sub: 'user-123' });
    const refresh = service.signRefresh({ sub: 'user-123' });

    const decodedAccess = service.verifyAccess(access);
    const decodedRefresh = service.verifyRefresh(refresh);

    const accessTtl = decodedAccess.exp - decodedAccess.iat;
    const refreshTtl = decodedRefresh.exp - decodedRefresh.iat;

    expect(accessTtl).toBe(15 * 60);
    expect(refreshTtl).toBe(30 * 24 * 60 * 60);
  });

  it('throws at construction time when JWT_ACCESS_SECRET is missing', () => {
    expect(() => buildService({ [env.JWT_ACCESS_SECRET]: undefined })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('throws at construction time when JWT_REFRESH_SECRET is missing', () => {
    expect(() => buildService({ [env.JWT_REFRESH_SECRET]: undefined })).toThrow(
      /JWT_REFRESH_SECRET/,
    );
  });
});
