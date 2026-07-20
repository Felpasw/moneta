export class MultipleOpenInvoicesError extends Error {
  constructor(accountId: string) {
    super(
      `Credit card account ${accountId} already has an open invoice; only one open invoice is allowed at a time`,
    );
    this.name = 'MultipleOpenInvoicesError';
  }
}
