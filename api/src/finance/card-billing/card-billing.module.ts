import { Module } from '@nestjs/common';

import { CreditCardCycleService } from './domain/services/credit-card-cycle.service';
import { INVOICES_REPOSITORY } from './domain/ports/invoices-repository';
import { PrismaInvoicesRepository } from './infrastructure/repositories/prisma-invoices.repository';

@Module({
  providers: [
    {
      provide: INVOICES_REPOSITORY,
      useClass: PrismaInvoicesRepository,
    },
    CreditCardCycleService,
  ],
  exports: [INVOICES_REPOSITORY, CreditCardCycleService],
})
export class CardBillingModule {}
