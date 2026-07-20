import { Module } from '@nestjs/common';

import { CardBillingModule } from '../../../finance/card-billing/card-billing.module';
import { GetCurrentInvoiceTool } from './get-current-invoice.tool';
import { ListInvoicesTool } from './list-invoices.tool';

@Module({
  imports: [CardBillingModule],
  providers: [GetCurrentInvoiceTool, ListInvoicesTool],
})
export class CardBillingToolsModule {}
