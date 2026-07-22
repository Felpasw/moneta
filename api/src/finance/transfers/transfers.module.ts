import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { CreateTransferUseCase } from './application/use-cases/create-transfer.use-case';
import { DeleteTransferUseCase } from './application/use-cases/delete-transfer.use-case';
import { ListTransfersUseCase } from './application/use-cases/list-transfers.use-case';
import { TRANSFERS_REPOSITORY } from './domain/ports/transfers-repository';
import { PrismaTransfersRepository } from './infrastructure/repositories/prisma-transfers.repository';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [AuthModule],
  controllers: [TransfersController],
  providers: [
    {
      provide: TRANSFERS_REPOSITORY,
      useClass: PrismaTransfersRepository,
    },
    ListTransfersUseCase,
    CreateTransferUseCase,
    DeleteTransferUseCase,
  ],
  exports: [ListTransfersUseCase, CreateTransferUseCase, DeleteTransferUseCase],
})
export class TransfersModule {}
