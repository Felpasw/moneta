export class SavedChartNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Saved chart ${id} not found`);
    this.name = 'SavedChartNotFoundError';
  }
}
