import { AgentMode } from '~/agent/domain/constants/agent-mode';
import { resolveAgentMode } from '~/agent/domain/prompts/agent-mode';
import { composeSystemPrompt } from '~/agent/domain/prompts/compose-system-prompt';
import { DEFAULT_TREATMENT_STYLE } from '~/agent/personality/domain/constants/treatment-style';

import { REALTIME_EVENT_TYPE } from '../constants/realtime-event-types';
import type { SystemPromptContext } from '../types/system-prompt-context';

const shouldPromptResponseOnOpen = (mode: AgentMode): boolean =>
  mode === AgentMode.Onboarding || mode === AgentMode.DashboardTour;

const injectSystemPrompt = async (ctx: SystemPromptContext): Promise<void> => {
  const [profile, user, userAccounts] = await Promise.all([
    ctx.profiles.findByUserId(ctx.userId),
    ctx.users.findById(ctx.userId),
    ctx.accounts.execute({ userId: ctx.userId }),
  ]);
  const treatmentStyle = profile?.treatmentStyle ?? DEFAULT_TREATMENT_STYLE;
  const mode = resolveAgentMode({
    hasNickname: Boolean(user?.nickname),
    hasBanks: userAccounts.length > 0,
    onboardedAt: user?.onboardedAt ?? null,
  });
  const instructions = composeSystemPrompt({
    treatmentStyle,
    onboarding: mode === AgentMode.Onboarding,
    dashboardTour: mode === AgentMode.DashboardTour,
    userName: user?.name ?? null,
    userNickname: user?.nickname ?? null,
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
  ctx.logger.log(`sending session.update for ${ctx.userId} (mode=${mode})`);
  ctx.upstream.send(JSON.stringify(sessionPayload));
  if (shouldPromptResponseOnOpen(mode)) {
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
