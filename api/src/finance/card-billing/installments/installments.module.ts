import { Module } from '@nestjs/common';

import { AccountsModule } from '../../accounts/accounts.module';
import { CardBillingModule } from '../card-billing.module';
import { AddInstallmentPurchaseUseCase } from './application/use-cases/add-installment-purchase.use-case';
import { CancelInstallmentPurchaseUseCase } from './application/use-cases/cancel-installment-purchase.use-case';
import { INSTALLMENT_GROUPS_REPOSITORY } from './domain/ports/installment-groups-repository';
import { PrismaInstallmentGroupsRepository } from './infrastructure/repositories/prisma-installment-groups.repository';

@Module({
  imports: [AccountsModule, CardBillingModule],
  providers: [
    {
      provide: INSTALLMENT_GROUPS_REPOSITORY,
      useClass: PrismaInstallmentGroupsRepository,
    },
    AddInstallmentPurchaseUseCase,
    CancelInstallmentPurchaseUseCase,
  ],
  exports: [AddInstallmentPurchaseUseCase, CancelInstallmentPurchaseUseCase],
})
export class InstallmentsModule {}
