import { z } from 'zod';

import { DICEBEAR_AVATAR_PATTERN } from '../domain/constants/avatar-url';
import { TreatmentStyle } from '../domain/constants/treatment-style';

export const updateProfileSchema = z
  .object({
    treatmentStyle: z.enum(TreatmentStyle).optional(),
    voiceId: z.string().min(1).max(255).optional(),
    avatarUrl: z
      .union([
        z.string().regex(DICEBEAR_AVATAR_PATTERN, {
          message:
            'avatarUrl must match the DiceBear pattern "dicebear:{style}:{seed}"',
        }),
        z.null(),
      ])
      .optional(),
  })
  .strict();

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
