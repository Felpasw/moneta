import { z } from 'zod';

import { TransactionType } from '../domain/constants/transaction-type';

export const editTransactionSchema = z.object({
  accountId: z.uuid().optional(),
  type: z.enum(TransactionType).optional(),
  amount: z.number().positive().optional(),
  categoryId: z.uuid().nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  occurredAt: z.iso
    .datetime()
    .transform((s) => new Date(s))
    .optional(),
});

export type EditTransactionDto = z.infer<typeof editTransactionSchema>;
