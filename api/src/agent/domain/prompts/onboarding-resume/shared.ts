export const RESUME_HEADER =
  'Contexto de retomada — este usuário JÁ passou por parte do onboarding em uma sessão anterior e voltou agora.';

export const nicknameSuffix = (nickname: string | null): string => {
  if (!nickname) return '';
  return ` (${nickname})`;
};

export const opening = (nickname: string | null): string => {
  if (!nickname) {
    return 'Cumprimente rapidamente ("Oi de novo") — sem apresentação longa nem explicar a Moneta.';
  }
  return `Cumprimente rapidamente ("Oi de novo, ${nickname}") — sem apresentação longa nem explicar a Moneta.`;
};
