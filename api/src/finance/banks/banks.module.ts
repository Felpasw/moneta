import { Module } from '@nestjs/common';

import { ListBanksUseCase } from './application/use-cases/list-banks.use-case';
import { BanksController } from './banks.controller';
import { BANKS_REPOSITORY } from './domain/ports/banks-repository';
import { PrismaBanksRepository } from './infrastructure/repositories/prisma-banks.repository';

@Module({
  controllers: [BanksController],
  providers: [
    { provide: BANKS_REPOSITORY, useClass: PrismaBanksRepository },
    ListBanksUseCase,
  ],
  exports: [ListBanksUseCase, BANKS_REPOSITORY],
})
export class BanksModule {}
