import { Module } from '@nestjs/common';

import { UsersModule } from '../../../users/users.module';
import { SetNicknameTool } from './set-nickname.tool';

@Module({
  imports: [UsersModule],
  providers: [SetNicknameTool],
})
export class OnboardingToolsModule {}
