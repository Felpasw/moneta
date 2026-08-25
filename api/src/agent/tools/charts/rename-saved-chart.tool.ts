import { Inject } from '@nestjs/common';
import { z } from 'zod';

import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';
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

const renameSavedChartInputSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(1).max(100),
  })
  .strict();

@RegisterAssistantTool()
export class RenameSavedChartTool implements AssistantTool {
  readonly name = 'rename_saved_chart';
  readonly description =
    'Renames a saved chart owned by the current user. Returns the updated summary.';
  readonly jsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, maxLength: 100 },
    },
  };
  readonly playbook =
    'Renames a saved chart. Name is trimmed and limited to 1-100 chars. Resolve the target id via list first if the user refers to a chart by its current name. Returns `{ id, name, pinned, updatedAt }` on success or `not_found` when the id does not belong to the caller. Prefer clear, intent-oriented names ("Monthly spending — 2026") over shape names ("Bar chart").';

  constructor(
    @Inject(SAVED_CHARTS_REPOSITORY)
    private readonly repository: SavedChartsRepository,
  ) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = renameSavedChartInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`,
      };
    }

    try {
      const updated = await this.repository.rename({
        userId: ctx.userId,
        id: parsed.data.id,
        name: parsed.data.name,
      });
      return {
        ok: true,
        data: {
          id: updated.id,
          name: updated.name,
          pinned: updated.pinned,
          updatedAt: updated.updatedAt,
        },
      };
    } catch (err) {
      if (err instanceof SavedChartNotFoundError) {
        return { ok: false, error: 'not_found' };
      }
      throw err;
    }
  }
}
