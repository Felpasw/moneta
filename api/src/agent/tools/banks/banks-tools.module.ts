import { Module } from '@nestjs/common';

import { BanksModule } from '../../../finance/banks/banks.module';
import { ListBanksTool } from './list-banks.tool';

@Module({
  imports: [BanksModule],
  providers: [ListBanksTool],
})
export class BanksToolsModule {}
