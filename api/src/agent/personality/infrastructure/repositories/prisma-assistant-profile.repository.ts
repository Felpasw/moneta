import { Injectable } from '@nestjs/common';
import type { AssistantProfile as PrismaAssistantProfile } from '@prisma/client';

import { PrismaService } from '~/infrastructure/prisma/prisma.service';

import { TreatmentStyle } from '../../domain/constants/treatment-style';
import { ProfileNotFoundError } from '../../domain/errors/profile-not-found.error';
import type { AssistantProfileRepository } from '../../domain/ports/assistant-profile-repository';
import type { AssistantProfile } from '../../domain/types/assistant-profile';
import type { CreateAssistantProfileInput } from '../../domain/types/create-assistant-profile-input';
import type { UpdateAssistantProfileInput } from '../../domain/types/update-assistant-profile-input';

const PRISMA_RECORD_NOT_FOUND = 'P2025';

const isRecordNotFound = (err: unknown): boolean =>
  typeof err === 'object' &&
  err !== null &&
  (err as { code?: string }).code === PRISMA_RECORD_NOT_FOUND;

const toDomain = (row: PrismaAssistantProfile): AssistantProfile => ({
  ...row,
  treatmentStyle: row.treatmentStyle as TreatmentStyle,
});

@Injectable()
export class PrismaAssistantProfileRepository implements AssistantProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<AssistantProfile | null> {
    const row = await this.prisma.assistantProfile.findUnique({ where: { userId } });
    return row ? toDomain(row) : null;
  }

  async create(input: CreateAssistantProfileInput): Promise<AssistantProfile> {
    const row = await this.prisma.assistantProfile.create({
      data: {
        userId: input.userId,
        treatmentStyle: input.treatmentStyle,
        voiceId: input.voiceId,
        avatarUrl: input.avatarUrl,
      },
    });
    return toDomain(row);
  }

  async update(
    userId: string,
    patch: UpdateAssistantProfileInput,
  ): Promise<AssistantProfile> {
    try {
      const row = await this.prisma.assistantProfile.update({
        where: { userId },
        data: patch,
      });
      return toDomain(row);
    } catch (err) {
      if (isRecordNotFound(err)) throw new ProfileNotFoundError(userId);
      throw err;
    }
  }
}
