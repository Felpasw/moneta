import { z } from 'zod';

const asArray = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess(
    (v) => (Array.isArray(v) || v === undefined ? v : [v]),
    z.array(inner),
  );

export const listTransfersSchema = z.object({
  dateFrom: z.iso
    .datetime()
    .transform((s) => new Date(s))
    .optional(),
  dateTo: z.iso
    .datetime()
    .transform((s) => new Date(s))
    .optional(),
  accountIds: asArray(z.uuid()).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListTransfersDto = z.infer<typeof listTransfersSchema>;
