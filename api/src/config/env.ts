import { z } from 'zod';

export enum env {
  DATABASE_URL = 'DATABASE_URL',
  REDIS_URL = 'REDIS_URL',
  WEB_ORIGIN = 'WEB_ORIGIN',
  PORT = 'PORT',
  JWT_ACCESS_SECRET = 'JWT_ACCESS_SECRET',
  JWT_REFRESH_SECRET = 'JWT_REFRESH_SECRET',
}

const envSchema = z.object({
  [env.DATABASE_URL]: z.string().min(1),
  [env.REDIS_URL]: z.string().min(1),
  [env.JWT_ACCESS_SECRET]: z.string().min(1),
  [env.JWT_REFRESH_SECRET]: z.string().min(1),
  [env.WEB_ORIGIN]: z.url().default('http://localhost:3000'),
  [env.PORT]: z.coerce.number().int().positive().default(3333),
});

export type EnvSchema = z.infer<typeof envSchema>;

export const validateEnv = (raw: Record<string, unknown>): EnvSchema =>
  envSchema.parse(raw);
