import { Module } from '@nestjs/common';

import { OnboardingModule } from '../../../onboarding/onboarding.module';
import { AccountsModule } from '../../../finance/accounts/accounts.module';
import { UsersModule } from '../../../users/users.module';
import { AddUserBanksTool } from './add-user-banks.tool';
import { CompleteOnboardingTool } from './complete-onboarding.tool';
import { ConfigureAccountDetailsTool } from './configure-account-details.tool';
import { SetAccountBalancesTool } from './set-account-balances.tool';
import { SetNicknameTool } from './set-nickname.tool';

@Module({
  imports: [UsersModule, AccountsModule, OnboardingModule],
  providers: [
    SetNicknameTool,
    AddUserBanksTool,
    SetAccountBalancesTool,
    ConfigureAccountDetailsTool,
    CompleteOnboardingTool,
  ],
})
export class OnboardingToolsModule {}
