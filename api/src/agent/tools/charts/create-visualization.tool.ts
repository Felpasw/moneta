import { Inject } from '@nestjs/common';

import { ChartQueryBuilder } from '~/finance/charts/application/services/chart-query-builder';
import { chartSpecSchema } from '~/finance/charts/domain/schemas/chart-spec';
import { CLOCK, type Clock } from '~/@common/domain/ports/clock';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

@RegisterAssistantTool()
export class CreateVisualizationTool implements AssistantTool {
  readonly name = 'create_visualization';
  readonly description =
    'Builds a chart from a ChartSpec (chartType + xAxis + yAxis + filters + title). Returns { spec, data, meta } — `data.points` is the ready-to-render series (each point has an x label and a y number).';
  readonly jsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['chartType', 'xAxis', 'yAxis', 'filters', 'title'],
    properties: {
      chartType: {
        type: 'string',
        enum: [
          'bar',
          'stacked-bar',
          'line',
          'area',
          'pie',
          'donut',
          'scatter',
          'heatmap',
        ],
      },
      xAxis: {
        type: 'object',
        additionalProperties: false,
        required: ['field'],
        properties: {
          field: {
            type: 'string',
            enum: ['date', 'category', 'bank', 'transactionType'],
          },
          grouping: {
            type: 'string',
            enum: [
              'day',
              'week',
              'month',
              'quarter',
              'year',
              'category',
              'bank',
              'transactionType',
            ],
          },
        },
      },
      yAxis: {
        type: 'object',
        additionalProperties: false,
        required: ['field', 'aggregation'],
        properties: {
          field: { type: 'string', enum: ['amount', 'count'] },
          aggregation: {
            type: 'string',
            enum: ['sum', 'avg', 'min', 'max', 'count'],
          },
        },
      },
      filters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          dateRange: {},
          transactionTypes: {
            type: 'array',
            items: { type: 'string', enum: ['expense', 'income'] },
          },
          categoryIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
          accountIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
          bankIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
        },
      },
      title: { type: 'string', minLength: 1, maxLength: 100 },
      seriesLabel: { type: 'string', minLength: 1, maxLength: 100 },
    },
  };
  readonly playbook =
    'Builds a chart from a ChartSpec. Use when the user asks to see, plot, chart, visualize, or break down numeric data over time or across categories/banks/types. Returns `{ spec, data: { points, meta }, meta }` where `points = [{ x, y }, ...]` — ready for the frontend chart renderer (no client-side reshaping needed). Rules: (1) always pick `chartType` from the 8 allowed values (bar, stacked-bar, line, area, pie, donut, scatter, heatmap); (2) `xAxis.field` chooses the primary dimension — `date` for time series, `category`/`bank`/`transactionType` for breakdowns; (3) if `field=date`, always set `grouping` (day/week/month/quarter/year) — default `month` when unspecified; (4) `yAxis.aggregation=count` requires `field=count`, everything else uses `field=amount`; (5) `filters.dateRange` accepts absolute `{from, to}` ISO, named preset (`this_month`/`ytd`/`all_time`), or rolling `{unit, n}` — pick rolling for "last N days/months"; (6) `filters.*Ids` are UUIDs — resolve names to ids beforehand (categories, banks, accounts have their own lookup tools); NEVER pass a `userId` field, it comes from the session. Bank grouping is not yet supported — if the user asks a bank breakdown, group by category as a fallback and mention the limitation. Read-only, safe to call without confirmation.';

  constructor(
    private readonly chartQueryBuilder: ChartQueryBuilder,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = chartSpecSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`,
      };
    }

    const chartData = await this.chartQueryBuilder.build(
      parsed.data,
      ctx.userId,
      this.clock.now(),
    );

    return {
      ok: true,
      data: {
        spec: parsed.data,
        data: chartData,
        meta: chartData.meta,
      },
    };
  }
}
