import { z } from 'zod';

export const renameCategorySchema = z.object({
  name: z.string().min(1).max(80),
});

export type RenameCategoryDto = z.infer<typeof renameCategorySchema>;
