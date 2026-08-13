import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '../../../../@common/domain/ports/clock';
import { InvoiceStatus } from '../constants/invoice-status';
import {
  INVOICES_REPOSITORY,
  type Invoice,
  type InvoicesRepository,
} from '../ports/invoices-repository';
import type { ResolveInvoiceForDateInput } from '../types/resolve-invoice-for-date-input';
import { computeCycleForDate } from '../utils/cycle-math';

@Injectable()
export class CreditCardCycleService {
  constructor(
    @Inject(INVOICES_REPOSITORY)
    private readonly invoices: InvoicesRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async resolveInvoiceForDate(
    input: ResolveInvoiceForDateInput,
  ): Promise<Invoice> {
    const { cycleStart, cycleEnd, dueDate } = computeCycleForDate(
      input.date,
      input.closeDay,
      input.dueDay,
    );

    const existing = await this.invoices.findByAccountAndCycle(
      input.accountId,
      cycleStart,
    );
    if (existing) return existing;

    const nowMs = this.clock.now().getTime();
    let status: InvoiceStatus;
    if (cycleEnd.getTime() < nowMs) {
      status = InvoiceStatus.Closed;
    } else if (cycleStart.getTime() > nowMs) {
      status = InvoiceStatus.Scheduled;
    } else {
      status = InvoiceStatus.Open;
    }

    return this.invoices.create({
      accountId: input.accountId,
      cycleStart,
      cycleEnd,
      dueDate,
      status,
    });
  }
}
