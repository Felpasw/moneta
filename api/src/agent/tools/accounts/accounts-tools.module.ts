import { Module } from '@nestjs/common';

import { AccountsModule } from '../../../accounts/accounts.module';
import { AddBankAccountTool } from './add-bank-account.tool';
import { DeleteBankAccountTool } from './delete-bank-account.tool';
import { ListMyAccountsTool } from './list-my-accounts.tool';
import { SetBalanceTool } from './set-balance.tool';
import { UpdateBankAccountTool } from './update-bank-account.tool';

@Module({
  imports: [AccountsModule],
  providers: [
    ListMyAccountsTool,
    AddBankAccountTool,
    UpdateBankAccountTool,
    DeleteBankAccountTool,
    SetBalanceTool,
  ],
})
export class AccountsToolsModule {}
