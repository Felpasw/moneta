import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  USER_SIGNED_UP_EVENT,
  type UserSignedUpPayload,
} from '~/auth/domain/events/user-signed-up.event';

import { DEFAULT_TREATMENT_STYLE } from '../../domain/constants/treatment-style';
import {
  ASSISTANT_PROFILE_REPOSITORY,
  type AssistantProfileRepository,
} from '../../domain/ports/assistant-profile-repository';
import type { UserSignedUpListenerOptions } from '../../domain/types/user-signed-up-listener-options';
import { USER_SIGNED_UP_LISTENER_OPTIONS } from '../constants/user-signed-up-listener-options-token';

@Injectable()
export class UserSignedUpListener {
  constructor(
    @Inject(ASSISTANT_PROFILE_REPOSITORY)
    private readonly repo: AssistantProfileRepository,
    @Inject(USER_SIGNED_UP_LISTENER_OPTIONS)
    private readonly options: UserSignedUpListenerOptions,
  ) {}

  @OnEvent(USER_SIGNED_UP_EVENT)
  async handle(payload: UserSignedUpPayload): Promise<void> {
    const existing = await this.repo.findByUserId(payload.userId);
    if (existing) return;
    await this.repo.create({
      userId: payload.userId,
      treatmentStyle: DEFAULT_TREATMENT_STYLE,
      voiceId: this.options.defaultVoiceId,
      avatarUrl: null,
    });
  }
}
