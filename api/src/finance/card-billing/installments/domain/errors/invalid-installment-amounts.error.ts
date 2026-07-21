export class InvalidInstallmentAmountsError extends Error {
  constructor() {
    super(
      'Either totalAmount or installmentAmount must be provided (both positive)',
    );
    this.name = 'InvalidInstallmentAmountsError';
  }
}
