import { z } from 'zod';

import { RPM_AVATAR_URL_PATTERN } from '../domain/constants/avatar-url';
import { TreatmentStyle } from '../domain/constants/treatment-style';

export const updateProfileSchema = z
  .object({
    treatmentStyle: z.enum(TreatmentStyle).optional(),
    voiceId: z.string().min(1).max(255).optional(),
    avatarUrl: z
      .union([
        z.string().regex(RPM_AVATAR_URL_PATTERN, {
          message: 'avatarUrl must point to a Ready Player Me asset',
        }),
        z.null(),
      ])
      .optional(),
  })
  .strict();

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
