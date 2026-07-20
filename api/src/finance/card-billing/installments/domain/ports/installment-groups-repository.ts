import type { TransactionType } from '../../../../transactions/domain/constants/transaction-type';

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
}
