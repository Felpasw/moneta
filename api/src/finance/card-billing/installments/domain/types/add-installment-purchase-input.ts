export interface AddInstallmentPurchaseInput {
  userId: string;
  accountId: string;
  totalAmount?: number;
  installmentAmount?: number;
  installmentsCount: number;
  description: string;
  categoryId?: string;
  occurredAt: Date;
}
