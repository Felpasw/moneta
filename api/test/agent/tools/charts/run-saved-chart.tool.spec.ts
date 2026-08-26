import { RunSavedChartTool } from '~/agent/tools/charts/run-saved-chart.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const NOW = new Date('2026-08-15T14:30:00.000Z');
const CHART_ID = '11111111-1111-4111-8111-111111111111';

const spec = {
  chartType: 'bar' as const,
  xAxis: { field: 'category' as const, grouping: 'category' as const },
  yAxis: { field: 'amount' as const, aggregation: 'sum' as const },
  filters: { dateRange: { preset: 'this_month' as const } },
  title: 'Spending by category',
};

const savedChart = {
  id: CHART_ID,
  userId: CTX.userId,
  name: 'Monthly spending',
  spec,
  pinned: false,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
};

const chartData = {
  points: [{ x: 'Food', y: 100 }],
  meta: { totalRows: 1 },
};

const buildTool = () => {
  const repo = { findById: jest.fn() };
  const chartQueryBuilder = { build: jest.fn() };
  const clock = { now: () => NOW };
  const tool = new RunSavedChartTool(
    repo as unknown as ConstructorParameters<typeof RunSavedChartTool>[0],
    chartQueryBuilder as unknown as ConstructorParameters<
      typeof RunSavedChartTool
    >[1],
    clock,
  );
  return { tool, repo, chartQueryBuilder };
};

describe('RunSavedChartTool', () => {
  it('exposes name/description/playbook', () => {
    const { tool } = buildTool();
    expect(tool.name).toBe('run_saved_chart');
    expect(tool.playbook.length).toBeGreaterThan(0);
  });

  it('loads saved chart, runs ChartQueryBuilder, returns { spec, data, meta } and emits chart.open sideEffect', async () => {
    const { tool, repo, chartQueryBuilder } = buildTool();
    repo.findById.mockResolvedValue(savedChart);
    chartQueryBuilder.build.mockResolvedValue(chartData);

    const result = await tool.execute({ id: CHART_ID }, CTX);

    expect(repo.findById).toHaveBeenCalledWith({
      userId: CTX.userId,
      id: CHART_ID,
    });
    expect(chartQueryBuilder.build).toHaveBeenCalledWith(spec, CTX.userId, NOW);
    expect(result).toEqual({
      ok: true,
      data: { spec, data: chartData, meta: chartData.meta },
      sideEffects: [
        { kind: 'chartOpen', spec, data: chartData, meta: chartData.meta },
      ],
    });
  });

  it('returns not_found when saved chart does not belong to the user', async () => {
    const { tool, repo, chartQueryBuilder } = buildTool();
    repo.findById.mockResolvedValue(null);

    const result = await tool.execute({ id: CHART_ID }, CTX);

    expect(result).toEqual({ ok: false, error: 'not_found' });
    expect(chartQueryBuilder.build).not.toHaveBeenCalled();
  });

  it('rejects non-uuid id', async () => {
    const { tool, repo } = buildTool();

    const result = await tool.execute({ id: 'not-a-uuid' }, CTX);

    expect(result.ok).toBe(false);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});
