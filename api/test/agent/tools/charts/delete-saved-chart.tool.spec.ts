import { DeleteSavedChartTool } from '~/agent/tools/charts/delete-saved-chart.tool';
import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const CHART_ID = '11111111-1111-4111-8111-111111111111';

const buildTool = () => {
  const repo = { delete: jest.fn() };
  const tool = new DeleteSavedChartTool(
    repo as unknown as ConstructorParameters<typeof DeleteSavedChartTool>[0],
  );
  return { tool, repo };
};

describe('DeleteSavedChartTool', () => {
  it('deletes with ctx.userId + id and returns { deleted: true }', async () => {
    const { tool, repo } = buildTool();
    repo.delete.mockResolvedValue(undefined);

    const result = await tool.execute({ id: CHART_ID }, CTX);

    expect(repo.delete).toHaveBeenCalledWith({
      userId: CTX.userId,
      id: CHART_ID,
    });
    expect(result).toEqual({ ok: true, data: { deleted: true } });
  });

  it('returns { ok: false, error: "not_found" } when repo throws SavedChartNotFoundError', async () => {
    const { tool, repo } = buildTool();
    repo.delete.mockRejectedValue(new SavedChartNotFoundError(CHART_ID));

    const result = await tool.execute({ id: CHART_ID }, CTX);

    expect(result).toEqual({ ok: false, error: 'not_found' });
  });

  it('rejects non-uuid id', async () => {
    const { tool, repo } = buildTool();

    const result = await tool.execute({ id: 'not-a-uuid' }, CTX);

    expect(result.ok).toBe(false);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
