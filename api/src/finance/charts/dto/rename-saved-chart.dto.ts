import { z } from 'zod';

export const renameSavedChartSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
  })
  .strict();

export type RenameSavedChartDto = z.infer<typeof renameSavedChartSchema>;
