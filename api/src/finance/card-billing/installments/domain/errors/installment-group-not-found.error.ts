export class InstallmentGroupNotFoundError extends Error {
  constructor(groupId: string) {
    super(`Installment group not found or not owned by user: ${groupId}`);
    this.name = 'InstallmentGroupNotFoundError';
  }
}
