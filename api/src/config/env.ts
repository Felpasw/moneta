import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env.local' });
dotenv.config();

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  LLM_API_KEY: z.string().min(1),
  TTS_API_KEY: z.string().min(1),
  TTS_DEFAULT_VOICE_ID: z.string().min(1),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  RP_ID: z.string().min(1).default('localhost'),
  RP_NAME: z.string().min(1).default('Moneta'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
