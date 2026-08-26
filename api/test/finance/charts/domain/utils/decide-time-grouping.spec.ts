import { decideTimeGrouping } from '~/finance/charts/domain/utils/decide-time-grouping';

const range = (fromIso: string, toIso: string) => ({
  from: new Date(fromIso),
  to: new Date(toIso),
});

describe('decideTimeGrouping', () => {
  it('keeps day when the interval fits under the cap', () => {
    const result = decideTimeGrouping(
      'day',
      range('2026-08-01T00:00:00Z', '2026-08-31T23:59:59Z'),
    );
    expect(result).toEqual({ effective: 'day' });
  });

  it('escalates day → week when estimated day buckets exceed the cap', () => {
    const result = decideTimeGrouping(
      'day',
      range('2025-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    );
    expect(result).toEqual({ effective: 'week', aggregatedFrom: 'day' });
  });

  it('escalates day → week → month for multi-year day requests', () => {
    const result = decideTimeGrouping(
      'day',
      range('2020-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    );
    expect(result).toEqual({ effective: 'month', aggregatedFrom: 'day' });
  });

  it('escalates week → month when weekly buckets still exceed the cap', () => {
    const result = decideTimeGrouping(
      'week',
      range('2020-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    );
    expect(result).toEqual({ effective: 'month', aggregatedFrom: 'week' });
  });

  it('keeps month even with very long ranges (already coarse enough)', () => {
    const result = decideTimeGrouping(
      'month',
      range('2000-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    );
    expect(result).toEqual({ effective: 'month' });
  });

  it('keeps quarter and year untouched (already coarse)', () => {
    expect(
      decideTimeGrouping(
        'quarter',
        range('2000-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
      ),
    ).toEqual({ effective: 'quarter' });
    expect(
      decideTimeGrouping(
        'year',
        range('1900-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
      ),
    ).toEqual({ effective: 'year' });
  });

  it('escalates day/week to month when dateRange is undefined (all_time)', () => {
    expect(decideTimeGrouping('day', undefined)).toEqual({
      effective: 'month',
      aggregatedFrom: 'day',
    });
    expect(decideTimeGrouping('week', undefined)).toEqual({
      effective: 'month',
      aggregatedFrom: 'week',
    });
  });

  it('keeps month/quarter/year when dateRange is undefined', () => {
    expect(decideTimeGrouping('month', undefined)).toEqual({
      effective: 'month',
    });
    expect(decideTimeGrouping('quarter', undefined)).toEqual({
      effective: 'quarter',
    });
    expect(decideTimeGrouping('year', undefined)).toEqual({
      effective: 'year',
    });
  });
});
