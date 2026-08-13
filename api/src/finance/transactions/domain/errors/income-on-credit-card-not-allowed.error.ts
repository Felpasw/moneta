export class IncomeOnCreditCardNotAllowedError extends Error {
  constructor(accountId: string) {
    super(
      `Income transactions are not allowed on credit card accounts: ${accountId}. Register income on a checking account instead.`,
    );
    this.name = 'IncomeOnCreditCardNotAllowedError';
  }
}
