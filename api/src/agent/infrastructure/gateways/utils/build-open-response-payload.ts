import { AgentMode } from '../../../domain/constants/agent-mode';
import { OutputLanguage } from '../../../domain/constants/output-language';

import { REALTIME_EVENT_TYPE } from '../constants/realtime-event-types';

interface BuildOpenResponsePayloadInput {
  readonly mode: AgentMode;
  readonly userName: string | null;
  readonly userNickname: string | null;
  readonly outputLanguage: OutputLanguage;
}

type OpenResponsePayload =
  | { type: typeof REALTIME_EVENT_TYPE.responseCreate }
  | {
      type: typeof REALTIME_EVENT_TYPE.responseCreate;
      response: { instructions: string };
    };

const buildFreeGreetingInstructionsPtBr = (label: string | null): string => {
  const salute = label ? `Chame o usuário de ${label} e dê` : 'Dê';
  return `${salute} uma saudação de volta curta em uma única frase, no tom já configurado, e pergunte no que pode ajudar hoje. Não invente detalhes da conta nem retome tópicos anteriores sem contexto explícito. Responda em português do Brasil.`;
};

const buildFreeGreetingInstructionsEnUs = (label: string | null): string => {
  const salute = label ? `Address the user as ${label} and give` : 'Give';
  return `${salute} a short welcome-back in a single sentence, in the tone already configured, and ask what you can help with today. Do not invent account details or revisit prior topics without explicit context. Speak in English.`;
};

const FREE_GREETING_BUILDERS: Record<
  OutputLanguage,
  (label: string | null) => string
> = {
  [OutputLanguage.PtBr]: buildFreeGreetingInstructionsPtBr,
  [OutputLanguage.EnUs]: buildFreeGreetingInstructionsEnUs,
};

export const buildOpenResponsePayload = (
  input: BuildOpenResponsePayloadInput,
): OpenResponsePayload => {
  if (input.mode !== AgentMode.Free) {
    return { type: REALTIME_EVENT_TYPE.responseCreate };
  }
  const label = input.userNickname ?? input.userName;
  const build = FREE_GREETING_BUILDERS[input.outputLanguage];
  return {
    type: REALTIME_EVENT_TYPE.responseCreate,
    response: { instructions: build(label) },
  };
};
