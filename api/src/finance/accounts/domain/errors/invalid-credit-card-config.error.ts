export class InvalidCreditCardConfigError extends Error {
  constructor() {
    super(
      'Credit card accounts require creditLimit, closeDay and dueDay together; regular accounts must omit all three',
    );
    this.name = 'InvalidCreditCardConfigError';
  }
}
