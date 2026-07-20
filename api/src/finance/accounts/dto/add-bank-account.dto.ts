import { z } from 'zod';

export const addBankAccountSchema = z.object({
  bankId: z.uuid(),
  nickname: z.string().min(1).max(80),
  initialBalance: z.number().optional(),
  creditLimit: z.number().nonnegative().optional(),
  overdraftLimit: z.number().nonnegative().optional(),
  closeDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
});

export type AddBankAccountDto = z.infer<typeof addBankAccountSchema>;
