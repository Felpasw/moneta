import { envSchema } from '~/config/env';

const FULL_ENV = {
  DATABASE_URL: 'postgres://u:p@h:5432/db',
  REDIS_URL: 'redis://h:6379',
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  LLM_API_KEY: 'llm-key-test',
  TTS_API_KEY: 'tts-key-test',
  TTS_DEFAULT_VOICE_ID: 'voice-default-test',
  WEB_ORIGIN: 'http://localhost:3000',
  PORT: '3333',
};

const omit = (key: keyof typeof FULL_ENV): Record<string, unknown> => {
  const copy: Record<string, unknown> = { ...FULL_ENV };
  delete copy[key];
  return copy;
};

describe('envSchema', () => {
  it('parses a full env into a typed object', () => {
    const parsed = envSchema.parse(FULL_ENV);
    expect(parsed.DATABASE_URL).toBe(FULL_ENV.DATABASE_URL);
    expect(parsed.REDIS_URL).toBe(FULL_ENV.REDIS_URL);
    expect(parsed.JWT_ACCESS_SECRET).toBe(FULL_ENV.JWT_ACCESS_SECRET);
    expect(parsed.JWT_REFRESH_SECRET).toBe(FULL_ENV.JWT_REFRESH_SECRET);
    expect(parsed.LLM_API_KEY).toBe(FULL_ENV.LLM_API_KEY);
    expect(parsed.TTS_API_KEY).toBe(FULL_ENV.TTS_API_KEY);
    expect(parsed.TTS_DEFAULT_VOICE_ID).toBe(FULL_ENV.TTS_DEFAULT_VOICE_ID);
    expect(parsed.WEB_ORIGIN).toBe(FULL_ENV.WEB_ORIGIN);
    expect(parsed.PORT).toBe(3333);
  });

  it('coerces PORT from string to number', () => {
    const parsed = envSchema.parse({ ...FULL_ENV, PORT: '8080' });
    expect(parsed.PORT).toBe(8080);
    expect(typeof parsed.PORT).toBe('number');
  });

  it('applies default WEB_ORIGIN when not provided', () => {
    const parsed = envSchema.parse(omit('WEB_ORIGIN'));
    expect(parsed.WEB_ORIGIN).toBe('http://localhost:3000');
  });

  it('applies default PORT when not provided', () => {
    const parsed = envSchema.parse(omit('PORT'));
    expect(parsed.PORT).toBe(3333);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => envSchema.parse(omit('DATABASE_URL'))).toThrow(/DATABASE_URL/);
  });

  it('throws when REDIS_URL is missing', () => {
    expect(() => envSchema.parse(omit('REDIS_URL'))).toThrow(/REDIS_URL/);
  });

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    expect(() => envSchema.parse(omit('JWT_ACCESS_SECRET'))).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('throws when JWT_REFRESH_SECRET is missing', () => {
    expect(() => envSchema.parse(omit('JWT_REFRESH_SECRET'))).toThrow(
      /JWT_REFRESH_SECRET/,
    );
  });

  it('throws when LLM_API_KEY is missing', () => {
    expect(() => envSchema.parse(omit('LLM_API_KEY'))).toThrow(/LLM_API_KEY/);
  });

  it('throws when TTS_API_KEY is missing', () => {
    expect(() => envSchema.parse(omit('TTS_API_KEY'))).toThrow(/TTS_API_KEY/);
  });

  it('throws when TTS_DEFAULT_VOICE_ID is missing', () => {
    expect(() => envSchema.parse(omit('TTS_DEFAULT_VOICE_ID'))).toThrow(
      /TTS_DEFAULT_VOICE_ID/,
    );
  });

  it('throws when WEB_ORIGIN is not a valid URL', () => {
    expect(() =>
      envSchema.parse({ ...FULL_ENV, WEB_ORIGIN: 'not-a-url' }),
    ).toThrow(/WEB_ORIGIN/);
  });

  it('throws when PORT is not a positive integer', () => {
    expect(() => envSchema.parse({ ...FULL_ENV, PORT: '-1' })).toThrow(/PORT/);
  });
});
