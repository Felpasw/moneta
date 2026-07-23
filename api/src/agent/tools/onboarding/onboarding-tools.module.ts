import { Module } from '@nestjs/common';

import { AccountsModule } from '../../../finance/accounts/accounts.module';
import { UsersModule } from '../../../users/users.module';
import { AddUserBanksTool } from './add-user-banks.tool';
import { SetNicknameTool } from './set-nickname.tool';

@Module({
  imports: [UsersModule, AccountsModule],
  providers: [SetNicknameTool, AddUserBanksTool],
})
export class OnboardingToolsModule {}
