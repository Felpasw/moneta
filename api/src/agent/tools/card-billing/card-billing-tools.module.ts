import { Module } from '@nestjs/common';

import { CardBillingModule } from '../../../finance/card-billing/card-billing.module';
import { InstallmentsModule } from '../../../finance/card-billing/installments/installments.module';
import { AddInstallmentPurchaseTool } from './add-installment-purchase.tool';
import { GetCurrentInvoiceTool } from './get-current-invoice.tool';
import { ListInvoicesTool } from './list-invoices.tool';
import { MarkInvoicePaidTool } from './mark-invoice-paid.tool';
import { PayInvoiceTool } from './pay-invoice.tool';

@Module({
  imports: [CardBillingModule, InstallmentsModule],
  providers: [
    GetCurrentInvoiceTool,
    ListInvoicesTool,
    PayInvoiceTool,
    MarkInvoicePaidTool,
    AddInstallmentPurchaseTool,
  ],
})
export class CardBillingToolsModule {}
