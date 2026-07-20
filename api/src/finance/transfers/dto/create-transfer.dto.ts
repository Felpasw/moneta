import { z } from 'zod';

export const createTransferSchema = z.object({
  fromAccountId: z.uuid(),
  toAccountId: z.uuid(),
  amount: z.number().positive(),
  description: z.string().max(255).optional(),
  occurredAt: z.iso.datetime().transform((s) => new Date(s)),
});

export type CreateTransferDto = z.infer<typeof createTransferSchema>;
