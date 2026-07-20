export class TransactionNotFoundError extends Error {
  constructor(transactionId: string) {
    super(`Transaction not found or not owned by user: ${transactionId}`);
    this.name = 'TransactionNotFoundError';
  }
}
