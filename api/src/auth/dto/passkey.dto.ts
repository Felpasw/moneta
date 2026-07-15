import { z } from 'zod';

const passkeyResponseSchema = z
  .object({
    id: z.string().min(1),
  })
  .passthrough();

export const enrollPasskeyFinishBodySchema = z.object({
  response: passkeyResponseSchema,
});
export type EnrollPasskeyFinishBodyDto = z.infer<
  typeof enrollPasskeyFinishBodySchema
>;

export const authPasskeyBeginBodySchema = z
  .object({
    email: z.email().optional(),
  })
  .optional()
  .default({});
export type AuthPasskeyBeginBodyDto = z.infer<
  typeof authPasskeyBeginBodySchema
>;

export const authPasskeyFinishBodySchema = z.object({
  sessionId: z.string().min(1),
  response: passkeyResponseSchema,
});
export type AuthPasskeyFinishBodyDto = z.infer<
  typeof authPasskeyFinishBodySchema
>;
