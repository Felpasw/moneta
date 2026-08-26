import { SaveChartTool } from '~/agent/tools/charts/save-chart.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = () => {
  const repo = { add: jest.fn() };
  const tool = new SaveChartTool(
    repo as unknown as ConstructorParameters<typeof SaveChartTool>[0],
  );
  return { tool, repo };
};

const validSpec = {
  chartType: 'bar' as const,
  xAxis: { field: 'category' as const, grouping: 'category' as const },
  yAxis: { field: 'amount' as const, aggregation: 'sum' as const },
  filters: { dateRange: { preset: 'this_month' as const } },
  title: 'Spending by category',
};

describe('SaveChartTool', () => {
  it('exposes name, description, jsonSchema and playbook', () => {
    const { tool } = buildTool();
    expect(tool.name).toBe('save_chart');
    expect(tool.description.length).toBeGreaterThan(0);
    expect(tool.playbook.length).toBeGreaterThan(0);
    expect(tool.jsonSchema).toEqual(expect.any(Object));
  });

  it('validates input, calls repo.add with ctx.userId, returns the new id', async () => {
    const { tool, repo } = buildTool();
    repo.add.mockResolvedValue({ id: 'chart-1' });

    const result = await tool.execute(
      { name: 'Monthly spending', spec: validSpec },
      CTX,
    );

    expect(repo.add).toHaveBeenCalledWith({
      userId: CTX.userId,
      name: 'Monthly spending',
      spec: validSpec,
    });
    expect(result).toEqual({ ok: true, data: { id: 'chart-1' } });
  });

  it('rejects invalid spec with structured error', async () => {
    const { tool, repo } = buildTool();

    const result = await tool.execute(
      {
        name: 'Bad',
        spec: { ...validSpec, xAxis: { field: 'password_hash' } },
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(repo.add).not.toHaveBeenCalled();
  });

  it('rejects empty name', async () => {
    const { tool, repo } = buildTool();

    const result = await tool.execute({ name: '', spec: validSpec }, CTX);

    expect(result.ok).toBe(false);
    expect(repo.add).not.toHaveBeenCalled();
  });

  it('rejects userId smuggle attempts (strict schema)', async () => {
    const { tool, repo } = buildTool();

    const result = await tool.execute(
      {
        name: 'X',
        spec: validSpec,
        userId: 'attacker',
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(repo.add).not.toHaveBeenCalled();
  });
});
