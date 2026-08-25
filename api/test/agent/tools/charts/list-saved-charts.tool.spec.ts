import { ListSavedChartsTool } from '~/agent/tools/charts/list-saved-charts.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = () => {
  const repo = { listSummaries: jest.fn() };
  const tool = new ListSavedChartsTool(
    repo as unknown as ConstructorParameters<typeof ListSavedChartsTool>[0],
  );
  return { tool, repo };
};

describe('ListSavedChartsTool', () => {
  it('exposes name/description/playbook', () => {
    const { tool } = buildTool();
    expect(tool.name).toBe('list_saved_charts');
    expect(tool.playbook.length).toBeGreaterThan(0);
  });

  it('calls repo.listSummaries with ctx.userId and returns items', async () => {
    const { tool, repo } = buildTool();
    const items = [
      {
        id: 'a',
        name: 'A',
        spec: { chartType: 'bar' },
        pinned: true,
        updatedAt: new Date(),
      },
    ];
    repo.listSummaries.mockResolvedValue(items);

    const result = await tool.execute({}, CTX);

    expect(repo.listSummaries).toHaveBeenCalledWith({ userId: CTX.userId });
    expect(result).toEqual({ ok: true, data: { items } });
  });

  it('rejects any extra input field (strict)', async () => {
    const { tool, repo } = buildTool();

    const result = await tool.execute({ userId: 'attacker' }, CTX);

    expect(result.ok).toBe(false);
    expect(repo.listSummaries).not.toHaveBeenCalled();
  });
});
