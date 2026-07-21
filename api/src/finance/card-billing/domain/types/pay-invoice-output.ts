import type { Transfer } from '../../../transfers/domain/ports/transfers-repository';
import type { Invoice } from '../ports/invoices-repository';

export interface PayInvoiceOutput {
  invoice: Invoice;
  transfer: Transfer;
}
