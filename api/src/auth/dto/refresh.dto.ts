import { z } from 'zod';

export const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .optional()
  .default({});

export type RefreshBodyDto = z.infer<typeof refreshBodySchema>;
