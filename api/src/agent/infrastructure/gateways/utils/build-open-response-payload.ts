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
  const salute = label ? `Chame o usuário de ${label} e dê` : 'Dê';
  return `${salute} boas-vindas de volta em uma única frase curta, no tom já configurado, e pergunte no que pode ajudar hoje. Não invente informações da conta nem retome tópicos anteriores sem contexto explícito.`;
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
