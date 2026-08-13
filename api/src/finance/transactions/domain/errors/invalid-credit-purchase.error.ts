export class InvalidCreditPurchaseError extends Error {
  constructor(reason: string) {
    super(`Invalid credit purchase: ${reason}`);
    this.name = 'InvalidCreditPurchaseError';
  }
}
