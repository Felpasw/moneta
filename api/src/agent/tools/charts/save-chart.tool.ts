import { Inject } from '@nestjs/common';
import { z } from 'zod';

import {
  SAVED_CHARTS_REPOSITORY,
  type SavedChartsRepository,
} from '~/finance/charts/domain/ports/saved-charts-repository';
import { chartSpecSchema } from '~/finance/charts/domain/schemas/chart-spec';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const saveChartInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    spec: chartSpecSchema,
  })
  .strict();

@RegisterAssistantTool()
export class SaveChartTool implements AssistantTool {
  readonly name = 'save_chart';
  readonly description =
    'Persists a ChartSpec under a user-facing name so it can be re-run later via `run_saved_chart`. Returns `{ id }`.';
  readonly jsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'spec'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      spec: { type: 'object' },
    },
  };
  readonly playbook =
    'Persists a ChartSpec (same shape validated by the create tool) with a short user-facing name (1-100 chars, trimmed). Call ONLY when the user explicitly asks to save/keep/pin/bookmark a chart just shown — never save proactively without confirmation. Suggest names that describe the analytical intent, not the chart type ("Monthly spending by category" beats "My bar chart"). Returns `{ id }` which can be handed back to other saved-chart tools. Strict input: extra fields (including userId) are rejected. Read/write, requires explicit consent from the user before firing.';

  constructor(
    @Inject(SAVED_CHARTS_REPOSITORY)
    private readonly repository: SavedChartsRepository,
  ) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = saveChartInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`,
      };
    }

    const created = await this.repository.add({
      userId: ctx.userId,
      name: parsed.data.name,
      spec: parsed.data.spec,
    });

    return { ok: true, data: { id: created.id } };
  }
}
