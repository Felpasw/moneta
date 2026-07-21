export class InvoiceNotFoundError extends Error {
  constructor(invoiceId: string) {
    super(`Invoice not found or not owned by user: ${invoiceId}`);
    this.name = 'InvoiceNotFoundError';
  }
}
