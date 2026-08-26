import { RenameSavedChartTool } from '~/agent/tools/charts/rename-saved-chart.tool';
import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const CHART_ID = '11111111-1111-4111-8111-111111111111';

const buildTool = () => {
  const repo = { rename: jest.fn() };
  const tool = new RenameSavedChartTool(
    repo as unknown as ConstructorParameters<typeof RenameSavedChartTool>[0],
  );
  return { tool, repo };
};

describe('RenameSavedChartTool', () => {
  it('renames with ctx.userId, id, name and returns summary shape', async () => {
    const { tool, repo } = buildTool();
    repo.rename.mockResolvedValue({
      id: CHART_ID,
      name: 'New',
      pinned: false,
      updatedAt: new Date('2026-06-01T00:00:00Z'),
    });

    const result = await tool.execute({ id: CHART_ID, name: 'New' }, CTX);

    expect(repo.rename).toHaveBeenCalledWith({
      userId: CTX.userId,
      id: CHART_ID,
      name: 'New',
    });
    expect(result).toMatchObject({
      ok: true,
      data: { id: CHART_ID, name: 'New', pinned: false },
    });
  });

  it('returns not_found when repo throws', async () => {
    const { tool, repo } = buildTool();
    repo.rename.mockRejectedValue(new SavedChartNotFoundError(CHART_ID));

    const result = await tool.execute({ id: CHART_ID, name: 'X' }, CTX);

    expect(result).toEqual({ ok: false, error: 'not_found' });
  });

  it('rejects empty name', async () => {
    const { tool, repo } = buildTool();

    const result = await tool.execute({ id: CHART_ID, name: '' }, CTX);

    expect(result.ok).toBe(false);
    expect(repo.rename).not.toHaveBeenCalled();
  });
});
