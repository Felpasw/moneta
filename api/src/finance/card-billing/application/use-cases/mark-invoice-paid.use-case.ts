import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '../../../../@common/domain/ports/clock';
import { InvoiceStatus } from '../../domain/constants/invoice-status';
import { InvoiceAlreadyPaidError } from '../../domain/errors/invoice-already-paid.error';
import { InvoiceNotFoundError } from '../../domain/errors/invoice-not-found.error';
import {
  INVOICES_REPOSITORY,
  type InvoicesRepository,
} from '../../domain/ports/invoices-repository';

@Injectable()
export class MarkInvoicePaidUseCase {
  constructor(
    @Inject(INVOICES_REPOSITORY)
    private readonly invoices: InvoicesRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: { invoiceId: string; userId: string }): Promise<void> {
    const invoice = await this.invoices.findByIdForUser(
      input.invoiceId,
      input.userId,
    );
    if (!invoice) throw new InvoiceNotFoundError(input.invoiceId);
    if (invoice.status === InvoiceStatus.Paid) {
      throw new InvoiceAlreadyPaidError(input.invoiceId);
    }
    await this.invoices.markPaid(invoice.id, this.clock.now(), undefined);
  }
}
