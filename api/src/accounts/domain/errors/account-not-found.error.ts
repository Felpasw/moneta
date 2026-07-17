export class AccountNotFoundError extends Error {
  constructor(accountId: string) {
    super(`Bank account not found: ${accountId}`);
    this.name = 'AccountNotFoundError';
  }
}
