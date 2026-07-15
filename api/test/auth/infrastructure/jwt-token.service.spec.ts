import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';

describe('JwtTokenService', () => {
  const service = new JwtTokenService();

  it('round-trips an access token — sign then verify returns the payload', () => {
    const token = service.signAccess({ sub: 'user-123' });
    const decoded = service.verifyAccess(token);
    expect(decoded.sub).toBe('user-123');
  });

  it('round-trips a refresh token — sign then verify returns the payload', () => {
    const token = service.signRefresh({ sub: 'user-123' });
    const decoded = service.verifyRefresh(token);
    expect(decoded.sub).toBe('user-123');
  });

  it('refuses to verify a refresh token with the access secret and vice-versa', () => {
    const access = service.signAccess({ sub: 'user-123' });
    const refresh = service.signRefresh({ sub: 'user-123' });
    expect(() => service.verifyRefresh(access)).toThrow();
    expect(() => service.verifyAccess(refresh)).toThrow();
  });

  it('bakes the expected TTLs into the token (access ~15m, refresh ~30d)', () => {
    const access = service.signAccess({ sub: 'user-123' });
    const refresh = service.signRefresh({ sub: 'user-123' });

    const decodedAccess = service.verifyAccess(access);
    const decodedRefresh = service.verifyRefresh(refresh);

    const accessTtl = decodedAccess.exp - decodedAccess.iat;
    const refreshTtl = decodedRefresh.exp - decodedRefresh.iat;

    expect(accessTtl).toBe(15 * 60);
    expect(refreshTtl).toBe(30 * 24 * 60 * 60);
  });
});
