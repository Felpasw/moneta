import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '../../../../@common/domain/ports/clock';
import { CreateTransferUseCase } from '../../../transfers/application/use-cases/create-transfer.use-case';
import { InvoiceStatus } from '../../domain/constants/invoice-status';
import { InvoiceAlreadyPaidError } from '../../domain/errors/invoice-already-paid.error';
import { InvoiceNotFoundError } from '../../domain/errors/invoice-not-found.error';
import {
  INVOICES_REPOSITORY,
  type InvoicesRepository,
} from '../../domain/ports/invoices-repository';
import type { PayInvoiceOutput } from '../../domain/types/pay-invoice-output';

@Injectable()
export class PayInvoiceUseCase {
  constructor(
    @Inject(INVOICES_REPOSITORY)
    private readonly invoices: InvoicesRepository,
    private readonly createTransfer: CreateTransferUseCase,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    invoiceId: string;
    fromAccountId: string;
    userId: string;
  }): Promise<PayInvoiceOutput> {
    const invoice = await this.invoices.findByIdForUser(
      input.invoiceId,
      input.userId,
    );
    if (!invoice) throw new InvoiceNotFoundError(input.invoiceId);
    if (invoice.status === InvoiceStatus.Paid) {
      throw new InvoiceAlreadyPaidError(input.invoiceId);
    }

    const now = this.clock.now();
    const transfer = await this.createTransfer.execute({
      userId: input.userId,
      fromAccountId: input.fromAccountId,
      toAccountId: invoice.accountId,
      amount: invoice.totalAmount,
      description: `Payment of invoice ${invoice.id}`,
      occurredAt: now,
    });

    await this.invoices.markPaid(invoice.id, now, transfer.id);

    return { invoice, transfer };
  }
}
