import { Inject, Injectable } from '@nestjs/common';

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

    return this.invoices.create({
      accountId: input.accountId,
      cycleStart,
      cycleEnd,
      dueDate,
    });
  }
}
