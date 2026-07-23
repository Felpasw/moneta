import { Module } from '@nestjs/common';

import { AccountsModule } from '../../../finance/accounts/accounts.module';
import { UsersModule } from '../../../users/users.module';
import { AddUserBanksTool } from './add-user-banks.tool';
import { SetAccountBalancesTool } from './set-account-balances.tool';
import { SetNicknameTool } from './set-nickname.tool';

@Module({
  imports: [UsersModule, AccountsModule],
  providers: [SetNicknameTool, AddUserBanksTool, SetAccountBalancesTool],
})
export class OnboardingToolsModule {}
