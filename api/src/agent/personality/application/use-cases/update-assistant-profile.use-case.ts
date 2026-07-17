import { Inject, Injectable } from '@nestjs/common';

import { RPM_AVATAR_URL_PATTERN } from '../../domain/constants/avatar-url';
import { InvalidAvatarUrlError } from '../../domain/errors/invalid-avatar-url.error';
import {
  ASSISTANT_PROFILE_REPOSITORY,
  type AssistantProfileRepository,
} from '../../domain/ports/assistant-profile-repository';
import type { AssistantProfile } from '../../domain/types/assistant-profile';
import type { UpdateAssistantProfileInput } from '../../domain/types/update-assistant-profile-input';

@Injectable()
export class UpdateAssistantProfileUseCase {
  constructor(
    @Inject(ASSISTANT_PROFILE_REPOSITORY)
    private readonly repo: AssistantProfileRepository,
  ) {}

  async execute(
    userId: string,
    patch: UpdateAssistantProfileInput,
  ): Promise<AssistantProfile> {
    if (
      typeof patch.avatarUrl === 'string' &&
      !RPM_AVATAR_URL_PATTERN.test(patch.avatarUrl)
    ) {
      throw new InvalidAvatarUrlError(patch.avatarUrl);
    }
    return this.repo.update(userId, patch);
  }
}
