import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { GetCurrentInvoiceUseCase } from './application/use-cases/get-current-invoice.use-case';
import { ListInvoicesUseCase } from './application/use-cases/list-invoices.use-case';
import { CreditCardCycleService } from './domain/services/credit-card-cycle.service';
import { INVOICES_REPOSITORY } from './domain/ports/invoices-repository';
import { PrismaInvoicesRepository } from './infrastructure/repositories/prisma-invoices.repository';

@Module({
  imports: [AccountsModule],
  providers: [
    {
      provide: INVOICES_REPOSITORY,
      useClass: PrismaInvoicesRepository,
    },
    CreditCardCycleService,
    GetCurrentInvoiceUseCase,
    ListInvoicesUseCase,
  ],
  exports: [
    INVOICES_REPOSITORY,
    CreditCardCycleService,
    GetCurrentInvoiceUseCase,
    ListInvoicesUseCase,
  ],
})
export class CardBillingModule {}
