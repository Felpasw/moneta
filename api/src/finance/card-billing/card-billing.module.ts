import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { TransfersModule } from '../transfers/transfers.module';
import { GetCurrentInvoiceUseCase } from './application/use-cases/get-current-invoice.use-case';
import { ListInvoicesUseCase } from './application/use-cases/list-invoices.use-case';
import { MarkInvoicePaidUseCase } from './application/use-cases/mark-invoice-paid.use-case';
import { PayInvoiceUseCase } from './application/use-cases/pay-invoice.use-case';
import { CreditCardCycleService } from './domain/services/credit-card-cycle.service';
import { INVOICES_REPOSITORY } from './domain/ports/invoices-repository';
import { TransferCreatedListener } from './infrastructure/events/transfer-created.listener';
import { PrismaInvoicesRepository } from './infrastructure/repositories/prisma-invoices.repository';

@Module({
  imports: [AccountsModule, TransfersModule],
  providers: [
    {
      provide: INVOICES_REPOSITORY,
      useClass: PrismaInvoicesRepository,
    },
    CreditCardCycleService,
    GetCurrentInvoiceUseCase,
    ListInvoicesUseCase,
    PayInvoiceUseCase,
    MarkInvoicePaidUseCase,
    TransferCreatedListener,
  ],
  exports: [
    INVOICES_REPOSITORY,
    CreditCardCycleService,
    GetCurrentInvoiceUseCase,
    ListInvoicesUseCase,
    PayInvoiceUseCase,
    MarkInvoicePaidUseCase,
  ],
})
export class CardBillingModule {}
