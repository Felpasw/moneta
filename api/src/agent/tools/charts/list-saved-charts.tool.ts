import { Inject } from '@nestjs/common';
import { z } from 'zod';

import {
  SAVED_CHARTS_REPOSITORY,
  type SavedChartsRepository,
} from '~/finance/charts/domain/ports/saved-charts-repository';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const listSavedChartsInputSchema = z.object({}).strict();

@RegisterAssistantTool()
export class ListSavedChartsTool implements AssistantTool {
  readonly name = 'list_saved_charts';
  readonly description =
    'Lists the current user saved charts (id, name, full spec, pinned flag, updatedAt), ordered pinned-first then most recent.';
  readonly jsonSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {},
  };
  readonly playbook =
    'Returns `{ items }` where each item is `{ id, name, spec, pinned, updatedAt }` ordered pinned-first then most recent. Use when the user asks "what charts have I saved", "show my saved charts", or when you need to resolve a name to an id before running/renaming/deleting a saved chart. `spec` is the full ChartSpec (safe to inspect chartType via `item.spec.chartType`, filters via `item.spec.filters`, etc.). Read-only, safe to call without confirmation.';

  constructor(
    @Inject(SAVED_CHARTS_REPOSITORY)
    private readonly repository: SavedChartsRepository,
  ) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = listSavedChartsInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`,
      };
    }
    const items = await this.repository.listSummaries({ userId: ctx.userId });
    return { ok: true, data: { items } };
  }
}
