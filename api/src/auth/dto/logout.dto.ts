import { z } from 'zod';

export const logoutBodySchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .optional()
  .default({});

export type LogoutBodyDto = z.infer<typeof logoutBodySchema>;
