import { resolveDateRange } from '~/finance/charts/domain/utils/resolve-date-range';

const now = new Date('2026-08-15T14:30:00.000Z');

describe('resolveDateRange', () => {
  it('returns undefined for the all_time preset', () => {
    expect(resolveDateRange({ preset: 'all_time' }, now)).toBeUndefined();
  });

  describe('absolute range', () => {
    it('parses ISO strings into Date pair', () => {
      const range = resolveDateRange(
        { from: '2026-06-01T00:00:00.000Z', to: '2026-06-30T23:59:59.999Z' },
        now,
      );
      expect(range).toEqual({
        from: new Date('2026-06-01T00:00:00.000Z'),
        to: new Date('2026-06-30T23:59:59.999Z'),
      });
    });
  });

  describe('named presets', () => {
    it('resolves this_month to the current UTC month', () => {
      const range = resolveDateRange({ preset: 'this_month' }, now);
      expect(range).toEqual({
        from: new Date('2026-08-01T00:00:00.000Z'),
        to: new Date('2026-08-31T23:59:59.999Z'),
      });
    });

    it('resolves ytd from January 1st of the current year to now', () => {
      const range = resolveDateRange({ preset: 'ytd' }, now);
      expect(range).toEqual({
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: now,
      });
    });
  });

  describe('rolling window', () => {
    it('subtracts n days from now for unit=day', () => {
      const range = resolveDateRange({ rolling: { unit: 'day', n: 7 } }, now);
      expect(range).toEqual({
        from: new Date('2026-08-08T14:30:00.000Z'),
        to: now,
      });
    });

    it('subtracts n*7 days from now for unit=week', () => {
      const range = resolveDateRange({ rolling: { unit: 'week', n: 2 } }, now);
      expect(range).toEqual({
        from: new Date('2026-08-01T14:30:00.000Z'),
        to: now,
      });
    });

    it('subtracts n months for unit=month', () => {
      const range = resolveDateRange({ rolling: { unit: 'month', n: 3 } }, now);
      expect(range).toEqual({
        from: new Date('2026-05-15T14:30:00.000Z'),
        to: now,
      });
    });

    it('subtracts n*3 months for unit=quarter', () => {
      const range = resolveDateRange(
        { rolling: { unit: 'quarter', n: 2 } },
        now,
      );
      expect(range).toEqual({
        from: new Date('2026-02-15T14:30:00.000Z'),
        to: now,
      });
    });

    it('subtracts n years for unit=year', () => {
      const range = resolveDateRange({ rolling: { unit: 'year', n: 2 } }, now);
      expect(range).toEqual({
        from: new Date('2024-08-15T14:30:00.000Z'),
        to: now,
      });
    });

    it('clamps day when the target month has fewer days', () => {
      const march31 = new Date('2026-03-31T12:00:00.000Z');
      const range = resolveDateRange(
        { rolling: { unit: 'month', n: 1 } },
        march31,
      );
      expect(range?.from.toISOString()).toBe('2026-02-28T12:00:00.000Z');
    });
  });
});
