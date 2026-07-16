import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infrastructure/prisma/prisma.service';

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

@Injectable()
export class PrismaAssistantProfileRepository implements AssistantProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string): Promise<AssistantProfile | null> {
    return this.prisma.assistantProfile.findUnique({ where: { userId } });
  }

  create(input: CreateAssistantProfileInput): Promise<AssistantProfile> {
    return this.prisma.assistantProfile.create({
      data: {
        userId: input.userId,
        treatmentStyle: input.treatmentStyle,
        voiceId: input.voiceId,
        avatarUrl: input.avatarUrl,
      },
    });
  }

  async update(
    userId: string,
    patch: UpdateAssistantProfileInput,
  ): Promise<AssistantProfile> {
    try {
      return await this.prisma.assistantProfile.update({
        where: { userId },
        data: patch,
      });
    } catch (err) {
      if (isRecordNotFound(err)) throw new ProfileNotFoundError(userId);
      throw err;
    }
  }
}
