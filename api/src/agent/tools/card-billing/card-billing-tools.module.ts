import { Module } from '@nestjs/common';

import { CardBillingModule } from '../../../finance/card-billing/card-billing.module';
import { GetCurrentInvoiceTool } from './get-current-invoice.tool';
import { ListInvoicesTool } from './list-invoices.tool';
import { MarkInvoicePaidTool } from './mark-invoice-paid.tool';
import { PayInvoiceTool } from './pay-invoice.tool';

@Module({
  imports: [CardBillingModule],
  providers: [
    GetCurrentInvoiceTool,
    ListInvoicesTool,
    PayInvoiceTool,
    MarkInvoicePaidTool,
  ],
})
export class CardBillingToolsModule {}
