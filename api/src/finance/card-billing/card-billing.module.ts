import { Module } from '@nestjs/common';

import { INVOICES_REPOSITORY } from './domain/ports/invoices-repository';
import { PrismaInvoicesRepository } from './infrastructure/repositories/prisma-invoices.repository';

@Module({
  providers: [
    {
      provide: INVOICES_REPOSITORY,
      useClass: PrismaInvoicesRepository,
    },
  ],
  exports: [INVOICES_REPOSITORY],
})
export class CardBillingModule {}
