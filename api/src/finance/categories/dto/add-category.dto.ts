import { z } from 'zod';

export const addCategorySchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().min(1).max(50).optional(),
  color: z.string().min(1).max(20).optional(),
});

export type AddCategoryDto = z.infer<typeof addCategorySchema>;
