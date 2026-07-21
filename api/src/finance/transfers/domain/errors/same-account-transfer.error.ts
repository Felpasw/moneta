export class SameAccountTransferError extends Error {
  constructor(accountId: string) {
    super(
      `Transfer must be between different accounts (both were ${accountId})`,
    );
    this.name = 'SameAccountTransferError';
  }
}
