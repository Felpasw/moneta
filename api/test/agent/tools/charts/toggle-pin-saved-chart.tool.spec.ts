import { TogglePinSavedChartTool } from '~/agent/tools/charts/toggle-pin-saved-chart.tool';
import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const CHART_ID = '11111111-1111-4111-8111-111111111111';

const buildTool = () => {
  const repo = { togglePin: jest.fn() };
  const tool = new TogglePinSavedChartTool(
    repo as unknown as ConstructorParameters<typeof TogglePinSavedChartTool>[0],
  );
  return { tool, repo };
};

describe('TogglePinSavedChartTool', () => {
  it('flips pin and returns { id, pinned }', async () => {
    const { tool, repo } = buildTool();
    repo.togglePin.mockResolvedValue({ id: CHART_ID, pinned: true });

    const result = await tool.execute({ id: CHART_ID }, CTX);

    expect(repo.togglePin).toHaveBeenCalledWith({
      userId: CTX.userId,
      id: CHART_ID,
    });
    expect(result).toEqual({
      ok: true,
      data: { id: CHART_ID, pinned: true },
    });
  });

  it('returns not_found when repo throws', async () => {
    const { tool, repo } = buildTool();
    repo.togglePin.mockRejectedValue(new SavedChartNotFoundError(CHART_ID));

    const result = await tool.execute({ id: CHART_ID }, CTX);

    expect(result).toEqual({ ok: false, error: 'not_found' });
  });
});
