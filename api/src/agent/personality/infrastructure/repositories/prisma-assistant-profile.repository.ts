import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infrastructure/prisma/prisma.service';

import type { AssistantProfileRepository } from '../../domain/ports/assistant-profile-repository';
import type { AssistantProfile } from '../../domain/types/assistant-profile';
import type { CreateAssistantProfileInput } from '../../domain/types/create-assistant-profile-input';

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
}
