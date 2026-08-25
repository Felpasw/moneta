import { Inject } from '@nestjs/common';
import { z } from 'zod';

import { ChartQueryBuilder } from '~/finance/charts/application/services/chart-query-builder';
import {
  SAVED_CHARTS_REPOSITORY,
  type SavedChartsRepository,
} from '~/finance/charts/domain/ports/saved-charts-repository';
import { CLOCK, type Clock } from '~/@common/domain/ports/clock';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const runSavedChartInputSchema = z.object({ id: z.uuid() }).strict();

@RegisterAssistantTool()
export class RunSavedChartTool implements AssistantTool {
  readonly name = 'run_saved_chart';
  readonly description =
    'Loads a saved ChartSpec by id and executes it against current data. Returns the same shape used by the ad-hoc chart tool (`{ spec, data, meta }`) and triggers the takeover overlay via chart.open.';
  readonly jsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } },
  };
  readonly playbook =
    'Reruns a saved chart with fresh data. Resolve the target id via the list tool if the user refers to a saved chart by name. Returns `{ spec, data, meta }` (identical shape to the ad-hoc chart tool) plus a chart.open side effect — the takeover overlay opens automatically on the client. Read-only, safe to call without confirmation. Structured `not_found` error when the id does not belong to the caller (never reveals existence for other users).';

  constructor(
    @Inject(SAVED_CHARTS_REPOSITORY)
    private readonly repository: SavedChartsRepository,
    private readonly chartQueryBuilder: ChartQueryBuilder,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = runSavedChartInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`,
      };
    }

    const saved = await this.repository.findById({
      userId: ctx.userId,
      id: parsed.data.id,
    });
    if (!saved) return { ok: false, error: 'not_found' };

    const chartData = await this.chartQueryBuilder.build(
      saved.spec,
      ctx.userId,
      this.clock.now(),
    );

    return {
      ok: true,
      data: { spec: saved.spec, data: chartData, meta: chartData.meta },
      sideEffects: [
        {
          kind: 'chartOpen',
          spec: saved.spec,
          data: chartData,
          meta: chartData.meta,
        },
      ],
    };
  }
}
