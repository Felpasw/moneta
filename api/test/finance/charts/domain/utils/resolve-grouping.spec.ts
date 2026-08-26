import { resolveGrouping } from '~/finance/charts/domain/utils/resolve-grouping';

describe('resolveGrouping', () => {
  it('returns the explicit grouping when provided', () => {
    expect(resolveGrouping({ field: 'date', grouping: 'week' })).toBe('week');
  });

  it('defaults to month when field is date and grouping is omitted', () => {
    expect(resolveGrouping({ field: 'date' })).toBe('month');
  });

  it('falls back to the field itself for non-date fields without grouping', () => {
    expect(resolveGrouping({ field: 'category' })).toBe('category');
    expect(resolveGrouping({ field: 'bank' })).toBe('bank');
    expect(resolveGrouping({ field: 'transactionType' })).toBe(
      'transactionType',
    );
  });
});
