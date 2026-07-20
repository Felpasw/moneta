export class InvoiceAlreadyPaidError extends Error {
  constructor(invoiceId: string) {
    super(`Invoice ${invoiceId} is already marked as paid`);
    this.name = 'InvoiceAlreadyPaidError';
  }
}
