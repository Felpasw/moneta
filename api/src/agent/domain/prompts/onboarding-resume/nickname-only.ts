import { RESUME_HEADER, nicknameSuffix, opening } from './shared';

interface RenderInput {
  nickname: string | null;
}

export function buildNicknameOnlyResumeSnippet({
  nickname,
}: RenderInput): string {
  return `${RESUME_HEADER} ${opening(nickname)}

Estado atual:
- Apelido: JÁ SETADO${nicknameSuffix(nickname)}
- Bancos: PENDENTE

Vá DIRETO pra etapa de BANCOS: pergunte "em quais bancos você tem conta?" e siga o fluxo canônico. NÃO pergunte apelido de novo nem se apresente.`;
}
