export interface AddCreditPurchaseInput {
  userId: string;
  accountId: string;
  amount: number;
  categoryId?: string;
  description?: string;
  occurredAt: Date;
}
