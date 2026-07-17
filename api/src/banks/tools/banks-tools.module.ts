import { Module } from '@nestjs/common';

import { BanksModule } from '../banks.module';
import { ListBanksTool } from './list-banks.tool';

@Module({
  imports: [BanksModule],
  providers: [ListBanksTool],
})
export class BanksToolsModule {}
