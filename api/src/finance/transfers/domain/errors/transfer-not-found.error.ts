export class TransferNotFoundError extends Error {
  constructor(transferId: string) {
    super(`Transfer not found or not owned by user: ${transferId}`);
    this.name = 'TransferNotFoundError';
  }
}
