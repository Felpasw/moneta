import { Module } from '@nestjs/common';

import { TransfersModule } from '../../../finance/transfers/transfers.module';
import { CreateTransferTool } from './create-transfer.tool';
import { DeleteTransferTool } from './delete-transfer.tool';
import { ListTransfersTool } from './list-transfers.tool';

@Module({
  imports: [TransfersModule],
  providers: [ListTransfersTool, CreateTransferTool, DeleteTransferTool],
})
export class TransfersToolsModule {}
