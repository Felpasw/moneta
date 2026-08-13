import { z } from 'zod';

export const addCreditPurchaseSchema = z.object({
  accountId: z.uuid(),
  amount: z.number().positive(),
  categoryId: z.uuid().optional(),
  description: z.string().max(255).optional(),
  occurredAt: z.iso.datetime().transform((s) => new Date(s)),
});

export type AddCreditPurchaseDto = z.infer<typeof addCreditPurchaseSchema>;
