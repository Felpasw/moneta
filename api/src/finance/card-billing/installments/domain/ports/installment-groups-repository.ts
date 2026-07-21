import type { TransactionType } from '../../../../transactions/domain/constants/transaction-type';
import type { CancelInstallmentPurchaseOutput } from '../types/cancel-installment-purchase-output';

export const INSTALLMENT_GROUPS_REPOSITORY = Symbol(
  'INSTALLMENT_GROUPS_REPOSITORY',
);

export interface InstallmentGroup {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  totalAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  description: string | null;
  purchaseDate: Date;
}

export interface CreateInstallmentGroupInput {
  userId: string;
  accountId: string;
  categoryId?: string;
  totalAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  description: string;
  purchaseDate: Date;
}

export interface InstallmentTransactionInput {
  userId: string;
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  occurredAt: Date;
  invoiceId: string;
  installmentNumber: number;
}

export interface CreatedInstallmentPurchase {
  group: InstallmentGroup;
  transactionIds: string[];
}

export interface InstallmentGroupsRepository {
  createGroupWithInstallments(input: {
    group: CreateInstallmentGroupInput;
    installments: InstallmentTransactionInput[];
  }): Promise<CreatedInstallmentPurchase>;
  // Cancels an installment group atomically: reverts balance and
  // invoice.total_amount for each installment, deletes the transactions,
  // then deletes the group. Ownership is enforced by user_id filter.
  cancelGroup(
    groupId: string,
    userId: string,
  ): Promise<CancelInstallmentPurchaseOutput>;
}
