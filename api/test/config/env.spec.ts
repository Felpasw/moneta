import { validateEnv } from '~/config/env';

const FULL_ENV = {
  DATABASE_URL: 'postgres://u:p@h:5432/db',
  REDIS_URL: 'redis://h:6379',
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  WEB_ORIGIN: 'http://localhost:3000',
  PORT: '3333',
};

const omit = (key: keyof typeof FULL_ENV): Record<string, unknown> => {
  const copy: Record<string, unknown> = { ...FULL_ENV };
  delete copy[key];
  return copy;
};

describe('validateEnv', () => {
  it('returns a validated env object with typed values', () => {
    const validated = validateEnv(FULL_ENV);
    expect(validated.DATABASE_URL).toBe(FULL_ENV.DATABASE_URL);
    expect(validated.REDIS_URL).toBe(FULL_ENV.REDIS_URL);
    expect(validated.JWT_ACCESS_SECRET).toBe(FULL_ENV.JWT_ACCESS_SECRET);
    expect(validated.JWT_REFRESH_SECRET).toBe(FULL_ENV.JWT_REFRESH_SECRET);
    expect(validated.WEB_ORIGIN).toBe(FULL_ENV.WEB_ORIGIN);
    expect(validated.PORT).toBe(3333);
  });

  it('coerces PORT from string to number', () => {
    const validated = validateEnv({ ...FULL_ENV, PORT: '8080' });
    expect(validated.PORT).toBe(8080);
    expect(typeof validated.PORT).toBe('number');
  });

  it('applies default WEB_ORIGIN when not provided', () => {
    const validated = validateEnv(omit('WEB_ORIGIN'));
    expect(validated.WEB_ORIGIN).toBe('http://localhost:3000');
  });

  it('applies default PORT when not provided', () => {
    const validated = validateEnv(omit('PORT'));
    expect(validated.PORT).toBe(3333);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnv(omit('DATABASE_URL'))).toThrow(/DATABASE_URL/);
  });

  it('throws when REDIS_URL is missing', () => {
    expect(() => validateEnv(omit('REDIS_URL'))).toThrow(/REDIS_URL/);
  });

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    expect(() => validateEnv(omit('JWT_ACCESS_SECRET'))).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('throws when JWT_REFRESH_SECRET is missing', () => {
    expect(() => validateEnv(omit('JWT_REFRESH_SECRET'))).toThrow(
      /JWT_REFRESH_SECRET/,
    );
  });

  it('throws when WEB_ORIGIN is not a valid URL', () => {
    expect(() => validateEnv({ ...FULL_ENV, WEB_ORIGIN: 'not-a-url' })).toThrow(
      /WEB_ORIGIN/,
    );
  });

  it('throws when PORT is not a positive integer', () => {
    expect(() => validateEnv({ ...FULL_ENV, PORT: '-1' })).toThrow(/PORT/);
  });
});
