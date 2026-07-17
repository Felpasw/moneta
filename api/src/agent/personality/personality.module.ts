import { Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';
import { env } from '~/config/env';

import { GetAssistantProfileUseCase } from './application/use-cases/get-assistant-profile.use-case';
import { UpdateAssistantProfileUseCase } from './application/use-cases/update-assistant-profile.use-case';
import { ASSISTANT_PROFILE_REPOSITORY } from './domain/ports/assistant-profile-repository';
import { USER_SIGNED_UP_LISTENER_OPTIONS } from './infrastructure/constants/user-signed-up-listener-options-token';
import { UserSignedUpListener } from './infrastructure/events/user-signed-up.listener';
import { PrismaAssistantProfileRepository } from './infrastructure/repositories/prisma-assistant-profile.repository';
import { PersonalityController } from './personality.controller';

@Module({
  imports: [AuthModule],
  controllers: [PersonalityController],
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
    GetAssistantProfileUseCase,
    UpdateAssistantProfileUseCase,
  ],
  exports: [ASSISTANT_PROFILE_REPOSITORY],
})
export class PersonalityModule {}
