import { z } from 'zod';

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    icon: z.string().max(50).nullable().optional(),
    color: z.string().max(20).nullable().optional(),
    monthlyBudget: z.number().positive().nullable().optional(),
  })
  .strict()
  .refine(
    (dto) =>
      dto.name !== undefined ||
      dto.icon !== undefined ||
      dto.color !== undefined ||
      dto.monthlyBudget !== undefined,
    { message: 'At least one field must be provided.' },
  );

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
