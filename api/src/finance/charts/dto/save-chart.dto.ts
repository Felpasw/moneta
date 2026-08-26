import { z } from 'zod';

import { chartSpecSchema } from '~/finance/charts/domain/schemas/chart-spec';

export const saveChartSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    spec: chartSpecSchema,
  })
  .strict();

export type SaveChartDto = z.infer<typeof saveChartSchema>;
