import type { InvoiceStatus } from '../constants/invoice-status';

export const INVOICES_REPOSITORY = Symbol('INVOICES_REPOSITORY');

export interface Invoice {
  id: string;
  accountId: string;
  status: InvoiceStatus;
  cycleStart: Date;
  cycleEnd: Date;
  dueDate: Date;
  totalAmount: number;
  closedAt: Date | null;
  paidAt: Date | null;
  paidViaTransferId: string | null;
}

export interface CreateInvoiceInput {
  accountId: string;
  cycleStart: Date;
  cycleEnd: Date;
  dueDate: Date;
}

export interface InvoicesRepository {
  create(input: CreateInvoiceInput): Promise<Invoice>;
  findOpenForAccount(accountId: string): Promise<Invoice | null>;
  findByAccountAndCycle(
    accountId: string,
    cycleStart: Date,
  ): Promise<Invoice | null>;
  listByAccount(accountId: string, status?: InvoiceStatus): Promise<Invoice[]>;
  // Fetch an invoice by id, enforcing ownership via the parent account.
  findByIdForUser(id: string, userId: string): Promise<Invoice | null>;
  // Flip an invoice to PAID. paidViaTransferId is optional — omitted means
  // the payment happened outside a tracked transfer (manual mark).
  markPaid(id: string, paidAt: Date, paidViaTransferId?: string): Promise<void>;
}
