import { z } from 'zod';

export const setBalanceSchema = z.object({
  amount: z.number(),
});

export type SetBalanceDto = z.infer<typeof setBalanceSchema>;
