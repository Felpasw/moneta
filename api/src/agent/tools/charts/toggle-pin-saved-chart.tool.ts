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

const togglePinSavedChartInputSchema = z.object({ id: z.uuid() }).strict();

@RegisterAssistantTool()
export class TogglePinSavedChartTool implements AssistantTool {
  readonly name = 'toggle_pin_saved_chart';
  readonly description =
    'Flips the pinned flag on a saved chart. Pinned charts float to the top of the list. Returns `{ id, pinned }`.';
  readonly jsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } },
  };
  readonly playbook =
    'Toggles pin on/off for a saved chart. Pinned charts appear first in the listing tool and surface on the dashboard grid. Read the current pinned state via the listing tool first if you need to be explicit ("já está pinado" vs "acabei de pinar"). Returns `{ id, pinned }` after the flip, or `not_found` when the id does not belong to the caller.';

  constructor(
    @Inject(SAVED_CHARTS_REPOSITORY)
    private readonly repository: SavedChartsRepository,
  ) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = togglePinSavedChartInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`,
      };
    }

    try {
      const updated = await this.repository.togglePin({
        userId: ctx.userId,
        id: parsed.data.id,
      });
      return { ok: true, data: { id: updated.id, pinned: updated.pinned } };
    } catch (err) {
      if (err instanceof SavedChartNotFoundError) {
        return { ok: false, error: 'not_found' };
      }
      throw err;
    }
  }
}
