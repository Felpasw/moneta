import { composeSystemPrompt } from '~/agent/domain/prompts/compose-system-prompt';
import { DEFAULT_TREATMENT_STYLE } from '~/agent/personality/domain/constants/treatment-style';

import { REALTIME_EVENT_TYPE } from '../constants/realtime-event-types';
import type { SystemPromptContext } from '../types/system-prompt-context';

const injectSystemPrompt = async (ctx: SystemPromptContext): Promise<void> => {
  const profile = await ctx.profiles.findByUserId(ctx.userId);
  const treatmentStyle = profile?.treatmentStyle ?? DEFAULT_TREATMENT_STYLE;
  const instructions = composeSystemPrompt({ treatmentStyle });
  ctx.upstream.send(
    JSON.stringify({
      type: REALTIME_EVENT_TYPE.sessionUpdate,
      session: { instructions },
    }),
  );
};

export const wireSystemPrompt = (ctx: SystemPromptContext): void => {
  ctx.upstream.onOpen(() => {
    injectSystemPrompt(ctx).catch((err: Error) => {
      ctx.logger.error(
        `failed to inject system prompt for ${ctx.userId}: ${err.message}`,
      );
    });
  });
};
