import { chartSpecSchema } from '~/finance/charts/domain/schemas/chart-spec';

const validSpec = {
  chartType: 'bar' as const,
  xAxis: { field: 'category' as const, grouping: 'month' as const },
  yAxis: { field: 'amount' as const, aggregation: 'sum' as const },
  filters: {
    dateRange: { rolling: { unit: 'month' as const, n: 1 } },
    transactionTypes: ['expense' as const],
  },
  title: 'Expenses by category last month',
};

describe('chartSpecSchema', () => {
  describe('happy path', () => {
    it('accepts a fully specified spec with rolling date range', () => {
      const result = chartSpecSchema.safeParse(validSpec);
      expect(result.success).toBe(true);
    });

    it('accepts a named preset date range', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { dateRange: { preset: 'this_month' } },
      });
      expect(result.success).toBe(true);
    });

    it('accepts an absolute date range', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: {
          dateRange: {
            from: '2026-06-01T00:00:00.000Z',
            to: '2026-06-30T23:59:59.999Z',
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts every supported chartType', () => {
      const types = [
        'bar',
        'stacked-bar',
        'line',
        'area',
        'pie',
        'donut',
        'scatter',
        'heatmap',
      ];
      for (const chartType of types) {
        const result = chartSpecSchema.safeParse({ ...validSpec, chartType });
        expect(result.success).toBe(true);
      }
    });

    it('accepts count aggregation with count field', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        yAxis: { field: 'count', aggregation: 'count' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('whitelist enforcement', () => {
    it('rejects an xAxis.field outside the whitelist', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        xAxis: { field: 'password_hash', grouping: 'month' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects an xAxis.grouping outside the whitelist', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        xAxis: { field: 'date', grouping: 'tag' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects an unknown chartType', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        chartType: 'radar',
      });
      expect(result.success).toBe(false);
    });

    it('rejects unknown top-level properties (strict)', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        rawSql: 'SELECT * FROM users',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('aggregation compatibility', () => {
    it('rejects sum aggregation on count field', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        yAxis: { field: 'count', aggregation: 'sum' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects avg aggregation on count field', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        yAxis: { field: 'count', aggregation: 'avg' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('date range', () => {
    it('rejects a preset outside the whitelist', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { dateRange: { preset: 'yesterday' } },
      });
      expect(result.success).toBe(false);
    });

    it('rejects an absolute range with malformed dates', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { dateRange: { from: 'not-a-date', to: 'also-not' } },
      });
      expect(result.success).toBe(false);
    });

    it('rejects a rolling window with unknown unit', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { dateRange: { rolling: { unit: 'decade', n: 1 } } },
      });
      expect(result.success).toBe(false);
    });

    it('rejects a rolling window with n below 1', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { dateRange: { rolling: { unit: 'day', n: 0 } } },
      });
      expect(result.success).toBe(false);
    });

    it('rejects a rolling window with n above the cap', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { dateRange: { rolling: { unit: 'day', n: 1001 } } },
      });
      expect(result.success).toBe(false);
    });

    it('rejects a rolling window with a non-integer n', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { dateRange: { rolling: { unit: 'month', n: 1.5 } } },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('filter ids', () => {
    it('rejects non-uuid categoryIds', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { ...validSpec.filters, categoryIds: ['not-a-uuid'] },
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-uuid accountIds', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { ...validSpec.filters, accountIds: ['not-a-uuid'] },
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-uuid bankIds', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { ...validSpec.filters, bankIds: ['not-a-uuid'] },
      });
      expect(result.success).toBe(false);
    });

    it('rejects transactionTypes outside the enum', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        filters: {
          ...validSpec.filters,
          transactionTypes: ['transfer'],
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('title', () => {
    it('rejects an empty title', () => {
      const result = chartSpecSchema.safeParse({ ...validSpec, title: '' });
      expect(result.success).toBe(false);
    });

    it('rejects a title longer than 100 characters', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        title: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });
});
