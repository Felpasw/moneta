import { Module } from '@nestjs/common';

import { env } from '~/config/env';

import { ASSISTANT_PROFILE_REPOSITORY } from './domain/ports/assistant-profile-repository';
import { USER_SIGNED_UP_LISTENER_OPTIONS } from './infrastructure/constants/user-signed-up-listener-options-token';
import { UserSignedUpListener } from './infrastructure/events/user-signed-up.listener';
import { PrismaAssistantProfileRepository } from './infrastructure/repositories/prisma-assistant-profile.repository';

@Module({
  providers: [
    {
      provide: ASSISTANT_PROFILE_REPOSITORY,
      useClass: PrismaAssistantProfileRepository,
    },
    {
      provide: USER_SIGNED_UP_LISTENER_OPTIONS,
      useFactory: () => ({ defaultVoiceId: env.TTS_DEFAULT_VOICE_ID }),
    },
    UserSignedUpListener,
  ],
  exports: [ASSISTANT_PROFILE_REPOSITORY],
})
export class PersonalityModule {}
