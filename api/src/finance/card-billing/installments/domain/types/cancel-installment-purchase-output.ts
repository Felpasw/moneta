export interface CancelInstallmentPurchaseOutput {
  deletedCount: number;
  affectedInvoiceIds: string[];
  refundedAmount: number;
}
