import { composeSystemPrompt } from '~/agent/domain/prompts/compose-system-prompt';
import { DEFAULT_TREATMENT_STYLE } from '~/agent/personality/domain/constants/treatment-style';

import { REALTIME_EVENT_TYPE } from '../constants/realtime-event-types';
import type { SystemPromptContext } from '../types/system-prompt-context';

const injectSystemPrompt = async (ctx: SystemPromptContext): Promise<void> => {
  const [profile, user] = await Promise.all([
    ctx.profiles.findByUserId(ctx.userId),
    ctx.users.findById(ctx.userId),
  ]);
  const treatmentStyle = profile?.treatmentStyle ?? DEFAULT_TREATMENT_STYLE;
  const isOnboarded = user?.onboardedAt != null;
  const instructions = composeSystemPrompt({
    treatmentStyle,
    onboarding: !isOnboarded,
    userName: user?.name ?? null,
  });
  const sessionPayload = {
    type: REALTIME_EVENT_TYPE.sessionUpdate,
    session: {
      type: 'realtime',
      instructions,
      output_modalities: ['text'],
      tools: ctx.registry.toRealtimeToolsList(),
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24000 },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      },
    },
  };
  ctx.logger.log(
    `sending session.update for ${ctx.userId} (onboarding=${!isOnboarded})`,
  );
  ctx.upstream.send(JSON.stringify(sessionPayload));
  if (!isOnboarded) {
    ctx.upstream.send(
      JSON.stringify({ type: REALTIME_EVENT_TYPE.responseCreate }),
    );
  }
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
