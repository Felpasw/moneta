export class InvalidInstallmentsCountError extends Error {
  constructor(count: number) {
    super(
      `installmentsCount must be >= 2 (a single-parcel purchase is a regular transaction); received ${count}`,
    );
    this.name = 'InvalidInstallmentsCountError';
  }
}
