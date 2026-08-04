import { AgentMode } from '../../../domain/constants/agent-mode';

import { REALTIME_EVENT_TYPE } from '../constants/realtime-event-types';

interface BuildOpenResponsePayloadInput {
  readonly mode: AgentMode;
  readonly userName: string | null;
  readonly userNickname: string | null;
}

type OpenResponsePayload =
  | { type: typeof REALTIME_EVENT_TYPE.responseCreate }
  | {
      type: typeof REALTIME_EVENT_TYPE.responseCreate;
      response: { instructions: string };
    };

const buildFreeGreetingInstructions = (label: string | null): string => {
  const salute = label ? `Address the user as ${label} and give` : 'Give';
  return `${salute} a short welcome-back in a single sentence, in the tone already configured, and ask what you can help with today. Do not invent account details or revisit prior topics without explicit context. Speak in English.`;
};

export const buildOpenResponsePayload = (
  input: BuildOpenResponsePayloadInput,
): OpenResponsePayload => {
  if (input.mode !== AgentMode.Free) {
    return { type: REALTIME_EVENT_TYPE.responseCreate };
  }
  const label = input.userNickname ?? input.userName;
  return {
    type: REALTIME_EVENT_TYPE.responseCreate,
    response: { instructions: buildFreeGreetingInstructions(label) },
  };
};
