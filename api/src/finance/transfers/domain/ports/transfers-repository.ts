export const TRANSFERS_REPOSITORY = Symbol('TRANSFERS_REPOSITORY');

export interface Transfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string | null;
  occurredAt: Date;
}

export interface CreateTransferInput {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  occurredAt: Date;
}

export interface ListTransfersFilters {
  userId: string;
  dateFrom?: Date;
  dateTo?: Date;
  accountIds?: string[];
  limit: number;
  offset: number;
}

export interface TransfersRepository {
  create(input: CreateTransferInput): Promise<Transfer>;
  list(filters: ListTransfersFilters): Promise<Transfer[]>;
  delete(id: string, userId: string): Promise<void>;
}
