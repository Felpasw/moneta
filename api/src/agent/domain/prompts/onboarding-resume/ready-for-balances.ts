import { RESUME_HEADER, nicknameSuffix, opening } from './shared';

interface RenderInput {
  nickname: string | null;
  banksCount: number;
}

const banksNoun = (count: number): string => {
  if (count === 1) return 'conta';
  return 'contas';
};

export function buildReadyForBalancesResumeSnippet({
  nickname,
  banksCount,
}: RenderInput): string {
  return `${RESUME_HEADER} ${opening(nickname)}

Estado atual:
- Apelido: JÁ SETADO${nicknameSuffix(nickname)}
- Bancos: JÁ CADASTRADOS (${banksCount} ${banksNoun(banksCount)})

Vá DIRETO pra etapa de SALDOS: pergunte "quanto tem em cada uma?" e siga o fluxo canônico. NÃO pergunte apelido nem bancos de novo.`;
}
