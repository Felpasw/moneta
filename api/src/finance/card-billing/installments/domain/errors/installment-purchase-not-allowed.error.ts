export class InstallmentPurchaseNotAllowedError extends Error {
  constructor(accountId: string) {
    super(
      `Installment purchase requires a credit card account (creditLimit != null): ${accountId}`,
    );
    this.name = 'InstallmentPurchaseNotAllowedError';
  }
}
