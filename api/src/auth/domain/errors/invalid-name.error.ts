export class InvalidNameError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidNameError';
  }
}
