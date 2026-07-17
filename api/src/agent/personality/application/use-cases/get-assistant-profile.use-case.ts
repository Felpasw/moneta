import { Inject, Injectable } from '@nestjs/common';

import { ProfileNotFoundError } from '../../domain/errors/profile-not-found.error';
import {
  ASSISTANT_PROFILE_REPOSITORY,
  type AssistantProfileRepository,
} from '../../domain/ports/assistant-profile-repository';
import type { AssistantProfile } from '../../domain/types/assistant-profile';

@Injectable()
export class GetAssistantProfileUseCase {
  constructor(
    @Inject(ASSISTANT_PROFILE_REPOSITORY)
    private readonly repo: AssistantProfileRepository,
  ) {}

  async execute(userId: string): Promise<AssistantProfile> {
    const profile = await this.repo.findByUserId(userId);
    if (!profile) throw new ProfileNotFoundError(userId);
    return profile;
  }
}
