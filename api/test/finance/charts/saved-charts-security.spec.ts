import { DeleteSavedChartTool } from '~/agent/tools/charts/delete-saved-chart.tool';
import { ListSavedChartsTool } from '~/agent/tools/charts/list-saved-charts.tool';
import { RenameSavedChartTool } from '~/agent/tools/charts/rename-saved-chart.tool';
import { RunSavedChartTool } from '~/agent/tools/charts/run-saved-chart.tool';
import { SaveChartTool } from '~/agent/tools/charts/save-chart.tool';
import { TogglePinSavedChartTool } from '~/agent/tools/charts/toggle-pin-saved-chart.tool';
import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';

const AUTHENTIC_USER = '11111111-1111-4111-8111-111111111111';
const OTHER_USER = '99999999-9999-4999-8999-999999999999';
const CHART_ID = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-08-15T14:30:00.000Z');

const CTX = { userId: AUTHENTIC_USER, requestId: 'req-1' };

const validSpec = {
  chartType: 'bar' as const,
  xAxis: { field: 'category' as const, grouping: 'category' as const },
  yAxis: { field: 'amount' as const, aggregation: 'sum' as const },
  filters: { dateRange: { preset: 'this_month' as const } },
  title: 'Test',
};

const savedRow = {
  id: CHART_ID,
  userId: AUTHENTIC_USER,
  name: 'X',
  spec: validSpec,
  pinned: false,
  createdAt: NOW,
  updatedAt: NOW,
};

const buildSaveTool = () => {
  const repo = { add: jest.fn() };
  return {
    tool: new SaveChartTool(
      repo as unknown as ConstructorParameters<typeof SaveChartTool>[0],
    ),
    repo,
  };
};
const buildListTool = () => {
  const repo = { listSummaries: jest.fn() };
  return {
    tool: new ListSavedChartsTool(
      repo as unknown as ConstructorParameters<typeof ListSavedChartsTool>[0],
    ),
    repo,
  };
};
const buildRunTool = () => {
  const repo = { findById: jest.fn() };
  const builder = { build: jest.fn() };
  const clock = { now: () => NOW };
  return {
    tool: new RunSavedChartTool(
      repo as unknown as ConstructorParameters<typeof RunSavedChartTool>[0],
      builder as unknown as ConstructorParameters<typeof RunSavedChartTool>[1],
      clock,
    ),
    repo,
    builder,
  };
};
const buildRenameTool = () => {
  const repo = { rename: jest.fn() };
  return {
    tool: new RenameSavedChartTool(
      repo as unknown as ConstructorParameters<typeof RenameSavedChartTool>[0],
    ),
    repo,
  };
};
const buildDeleteTool = () => {
  const repo = { delete: jest.fn() };
  return {
    tool: new DeleteSavedChartTool(
      repo as unknown as ConstructorParameters<typeof DeleteSavedChartTool>[0],
    ),
    repo,
  };
};
const buildToggleTool = () => {
  const repo = { togglePin: jest.fn() };
  return {
    tool: new TogglePinSavedChartTool(
      repo as unknown as ConstructorParameters<
        typeof TogglePinSavedChartTool
      >[0],
    ),
    repo,
  };
};

describe('saved charts security invariants (MNT-92)', () => {
  describe('userId is never taken from user input', () => {
    it('save_chart passes ctx.userId (not input) to repo.add', async () => {
      const { tool, repo } = buildSaveTool();
      repo.add.mockResolvedValue({ id: CHART_ID });

      await tool.execute(
        { name: 'X', spec: validSpec },
        { userId: AUTHENTIC_USER, requestId: 'r' },
      );

      const [firstCall] = repo.add.mock.calls as [[{ userId: string }]];
      expect(firstCall[0].userId).toBe(AUTHENTIC_USER);
    });

    it('save_chart strict schema rejects userId smuggle in the payload', async () => {
      const { tool, repo } = buildSaveTool();

      const result = await tool.execute(
        { name: 'X', spec: validSpec, userId: OTHER_USER },
        CTX,
      );

      expect(result.ok).toBe(false);
      expect(repo.add).not.toHaveBeenCalled();
    });

    it('list_saved_charts rejects any extra field (including userId)', async () => {
      const { tool, repo } = buildListTool();

      const result = await tool.execute({ userId: OTHER_USER }, CTX);

      expect(result.ok).toBe(false);
      expect(repo.listSummaries).not.toHaveBeenCalled();
    });

    it('run_saved_chart passes ctx.userId (not input) to repo.findById', async () => {
      const { tool, repo, builder } = buildRunTool();
      repo.findById.mockResolvedValue(savedRow);
      builder.build.mockResolvedValue({
        points: [],
        meta: { totalRows: 0 },
      });

      await tool.execute({ id: CHART_ID }, CTX);

      const [findCall] = repo.findById.mock.calls as [
        [{ userId: string; id: string }],
      ];
      expect(findCall[0]).toEqual({
        userId: AUTHENTIC_USER,
        id: CHART_ID,
      });
    });
  });

  describe('cross-user isolation surfaces as opaque not_found', () => {
    it.each([
      ['run_saved_chart', buildRunTool, 'findById', null],
      [
        'rename_saved_chart',
        buildRenameTool,
        'rename',
        new SavedChartNotFoundError(CHART_ID),
      ],
      [
        'delete_saved_chart',
        buildDeleteTool,
        'delete',
        new SavedChartNotFoundError(CHART_ID),
      ],
      [
        'toggle_pin_saved_chart',
        buildToggleTool,
        'togglePin',
        new SavedChartNotFoundError(CHART_ID),
      ],
    ])(
      '%s returns { error: "not_found" } when the chart does not belong to the caller',
      async (_name, factory, method, mockResult) => {
        const built = factory() as {
          tool: { execute: (i: unknown, c: typeof CTX) => Promise<unknown> };
          repo: Record<string, jest.Mock>;
        };
        if (mockResult instanceof Error) {
          built.repo[method].mockRejectedValue(mockResult);
        } else {
          built.repo[method].mockResolvedValue(mockResult);
        }

        const input =
          method === 'rename' ? { id: CHART_ID, name: 'X' } : { id: CHART_ID };
        const result = (await built.tool.execute(input, CTX)) as {
          ok: boolean;
          error?: string;
        };

        expect(result.ok).toBe(false);
        expect(result.error).toBe('not_found');
      },
    );
  });

  describe('save enforces the same whitelist as create_visualization', () => {
    it('rejects a spec with an out-of-whitelist xAxis.field', async () => {
      const { tool, repo } = buildSaveTool();

      const result = await tool.execute(
        {
          name: 'Bad',
          spec: {
            ...validSpec,
            xAxis: { field: 'password_hash', grouping: 'category' },
          },
        },
        CTX,
      );

      expect(result.ok).toBe(false);
      expect(repo.add).not.toHaveBeenCalled();
    });

    it('rejects a spec with an unknown chartType', async () => {
      const { tool, repo } = buildSaveTool();

      const result = await tool.execute(
        { name: 'Bad', spec: { ...validSpec, chartType: 'radar' } },
        CTX,
      );

      expect(result.ok).toBe(false);
      expect(repo.add).not.toHaveBeenCalled();
    });

    it('rejects a spec with an unknown top-level field (rawSql etc.)', async () => {
      const { tool, repo } = buildSaveTool();

      const result = await tool.execute(
        {
          name: 'Bad',
          spec: { ...validSpec, rawSql: 'SELECT * FROM credentials' },
        },
        CTX,
      );

      expect(result.ok).toBe(false);
      expect(repo.add).not.toHaveBeenCalled();
    });
  });

  describe('name sanitization', () => {
    it('save_chart rejects empty name', async () => {
      const { tool, repo } = buildSaveTool();

      const result = await tool.execute({ name: '', spec: validSpec }, CTX);

      expect(result.ok).toBe(false);
      expect(repo.add).not.toHaveBeenCalled();
    });

    it('save_chart rejects whitespace-only name (trimmed to empty)', async () => {
      const { tool, repo } = buildSaveTool();

      const result = await tool.execute({ name: '   ', spec: validSpec }, CTX);

      expect(result.ok).toBe(false);
      expect(repo.add).not.toHaveBeenCalled();
    });

    it('save_chart rejects names longer than 100 chars', async () => {
      const { tool, repo } = buildSaveTool();

      const result = await tool.execute(
        { name: 'a'.repeat(101), spec: validSpec },
        CTX,
      );

      expect(result.ok).toBe(false);
      expect(repo.add).not.toHaveBeenCalled();
    });

    it('rename_saved_chart applies the same name rules', async () => {
      const { tool, repo } = buildRenameTool();

      const cases = [
        { id: CHART_ID, name: '' },
        { id: CHART_ID, name: '   ' },
        { id: CHART_ID, name: 'a'.repeat(101) },
      ];

      for (const input of cases) {
        const result = await tool.execute(input, CTX);
        expect(result.ok).toBe(false);
      }
      expect(repo.rename).not.toHaveBeenCalled();
    });
  });

  describe('defense in depth: run_saved_chart revalidates the spec loaded from the DB', () => {
    it('rejects execution when the DB returns a spec that fails the whitelist', async () => {
      const { tool, repo, builder } = buildRunTool();
      repo.findById.mockResolvedValue({
        ...savedRow,
        spec: {
          ...validSpec,
          xAxis: { field: 'password_hash', grouping: 'category' },
        },
      });

      const result = await tool.execute({ id: CHART_ID }, CTX);

      expect(result.ok).toBe(false);
      expect(builder.build).not.toHaveBeenCalled();
    });

    it('rejects execution when the DB returns garbage where the spec should be', async () => {
      const { tool, repo, builder } = buildRunTool();
      repo.findById.mockResolvedValue({ ...savedRow, spec: {} });

      const result = await tool.execute({ id: CHART_ID }, CTX);

      expect(result.ok).toBe(false);
      expect(builder.build).not.toHaveBeenCalled();
    });
  });
});
