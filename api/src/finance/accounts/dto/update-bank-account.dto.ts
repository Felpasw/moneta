import { z } from 'zod';

export const updateBankAccountSchema = z.object({
  nickname: z.string().min(1).max(80).optional(),
  creditLimit: z.number().nonnegative().nullable().optional(),
  overdraftLimit: z.number().nonnegative().nullable().optional(),
  closeDay: z.number().int().min(1).max(31).nullable().optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
});

export type UpdateBankAccountDto = z.infer<typeof updateBankAccountSchema>;
