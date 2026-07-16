import { composeSystemPrompt } from '~/agent/domain/prompts/compose-system-prompt';
import { env } from '~/config/env';
import { httpClient } from '~/config/http';

import type { BehaviorFixture } from '../types/behavior-fixture';
import type { ChatCompletionsResponse } from '../types/chat-completions-response';
import type { ObservedCall } from '../types/observed-call';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

export const runChatCompletion = async (
  fixture: BehaviorFixture,
): Promise<ObservedCall | null> => {
  const systemPrompt = composeSystemPrompt({
    treatmentStyle: fixture.treatmentStyle,
  });
  const body = {
    model: env.LLM_BEHAVIOR_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...fixture.conversation,
    ],
    tools: fixture.tools,
    tool_choice: 'auto',
    temperature: 0,
  };

  const res = await httpClient.post<ChatCompletionsResponse>(
    OPENAI_CHAT_URL,
    body,
    {
      headers: {
        Authorization: `Bearer ${env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const call = res.data.choices[0]?.message.tool_calls?.[0];
  if (!call) return null;
  return {
    name: call.function.name,
    arguments: JSON.parse(call.function.arguments) as Record<string, unknown>,
  };
};
