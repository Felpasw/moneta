import { CreateVisualizationTool } from '~/agent/tools/charts/create-visualization.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const NOW = new Date('2026-08-15T14:30:00.000Z');

const buildTool = () => {
  const chartQueryBuilder = { build: jest.fn() };
  const clock = { now: jest.fn(() => NOW) };
  const tool = new CreateVisualizationTool(
    chartQueryBuilder as unknown as ConstructorParameters<
      typeof CreateVisualizationTool
    >[0],
    clock,
  );
  return { tool, chartQueryBuilder, clock };
};

const validInput = {
  chartType: 'bar',
  xAxis: { field: 'category', grouping: 'category' },
  yAxis: { field: 'amount', aggregation: 'sum' },
  filters: { dateRange: { preset: 'this_month' } },
  title: 'Spending by category',
};

describe('CreateVisualizationTool', () => {
  it('exposes name, description, jsonSchema and a non-empty playbook', () => {
    const { tool } = buildTool();
    expect(tool.name).toBe('create_visualization');
    expect(tool.description).toEqual(expect.any(String));
    expect(tool.description.length).toBeGreaterThan(0);
    expect(tool.playbook).toEqual(expect.any(String));
    expect(tool.playbook.length).toBeGreaterThan(0);
    expect(tool.jsonSchema).toEqual(expect.any(Object));
  });

  it('validates input, calls ChartQueryBuilder.build with ctx.userId and clock.now, wraps result', async () => {
    const { tool, chartQueryBuilder, clock } = buildTool();
    const chartData = {
      points: [
        { x: 'Food', y: 1200 },
        { x: 'Transport', y: 800 },
      ],
      meta: { totalRows: 2 },
    };
    chartQueryBuilder.build.mockResolvedValue(chartData);

    const result = await tool.execute(validInput, CTX);

    expect(chartQueryBuilder.build).toHaveBeenCalledWith(
      validInput,
      CTX.userId,
      NOW,
    );
    expect(clock.now).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      data: { spec: validInput, data: chartData, meta: chartData.meta },
    });
  });

  it('rejects invalid input (field outside the whitelist) with structured error', async () => {
    const { tool, chartQueryBuilder } = buildTool();

    const result = await tool.execute(
      {
        ...validInput,
        xAxis: { field: 'password_hash', grouping: 'category' },
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid input/i);
    expect(chartQueryBuilder.build).not.toHaveBeenCalled();
  });

  it('rejects any payload that smuggles a userId (strict schema, prevents impersonation)', async () => {
    const { tool, chartQueryBuilder } = buildTool();

    const result = await tool.execute(
      { ...validInput, userId: 'ATTACKER-USER-ID' },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(chartQueryBuilder.build).not.toHaveBeenCalled();
  });
});
