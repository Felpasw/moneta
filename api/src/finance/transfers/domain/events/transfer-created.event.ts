export const TRANSFER_CREATED_EVENT = 'finance.transfer.created';

export interface TransferCreatedPayload {
  readonly transferId: string;
  readonly userId: string;
  readonly fromAccountId: string;
  readonly toAccountId: string;
  readonly amount: number;
  readonly occurredAt: Date;
}
