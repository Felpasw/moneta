import { z } from 'zod';

import { TransactionType } from '../domain/constants/transaction-type';

export const addTransactionSchema = z.object({
  accountId: z.uuid(),
  type: z.enum(TransactionType),
  amount: z.number().positive(),
  categoryId: z.uuid().optional(),
  description: z.string().max(255).optional(),
  occurredAt: z.iso.datetime().transform((s) => new Date(s)),
});

export type AddTransactionDto = z.infer<typeof addTransactionSchema>;
