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

const deleteSavedChartInputSchema = z.object({ id: z.uuid() }).strict();

@RegisterAssistantTool()
export class DeleteSavedChartTool implements AssistantTool {
  readonly name = 'delete_saved_chart';
  readonly description =
    'Deletes a saved chart owned by the current user. Returns `{ deleted: true }` on success, structured error when the id is not found.';
  readonly jsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } },
  };
  readonly playbook =
    'Deletes a saved chart by id. Only ever call after the user explicitly confirms deletion — this operation is irreversible. If the user says something like "apaga meu gráfico X", resolve X to an id via the list tool first, then confirm the deletion in natural language, THEN call this. Returns `{ deleted: true }` on success or a structured `not_found` error when the id does not belong to the caller (never leaks whether the chart exists for another user).';

  constructor(
    @Inject(SAVED_CHARTS_REPOSITORY)
    private readonly repository: SavedChartsRepository,
  ) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = deleteSavedChartInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`,
      };
    }

    try {
      await this.repository.delete({
        userId: ctx.userId,
        id: parsed.data.id,
      });
      return { ok: true, data: { deleted: true } };
    } catch (err) {
      if (err instanceof SavedChartNotFoundError) {
        return { ok: false, error: 'not_found' };
      }
      throw err;
    }
  }
}
