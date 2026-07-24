import {
  DASHBOARD_TOUR_SNIPPET,
  DASHBOARD_TOUR_SNIPPET_VERSION,
} from '~/agent/domain/prompts/dashboard-tour';

describe('DASHBOARD_TOUR_SNIPPET', () => {
  it('sinaliza contexto de tour pós-onboarding (não é primeira sessão)', () => {
    const lower = DASHBOARD_TOUR_SNIPPET.toLowerCase();
    expect(lower).toMatch(/tour|apresenta|overview|painel|dashboard/);
  });

  it('cita as features core do sistema (transações por voz, saldos/faturas, categorias, contas, transferências)', () => {
    const lower = DASHBOARD_TOUR_SNIPPET.toLowerCase();
    expect(lower).toMatch(/transa[çc][ãa]o|gasto|ifood|voz/);
    expect(lower).toMatch(/saldo|fatura/);
    expect(lower).toMatch(/categori/);
    expect(lower).toMatch(/conta|cart[ãa]o|cheque especial/);
    expect(lower).toMatch(/transfer[êe]nci/);
  });

  it('menciona que dá pra editar tudo pelo menu (evita apontar rota específica de edit)', () => {
    expect(DASHBOARD_TOUR_SNIPPET.toLowerCase()).toMatch(/menu/);
  });

  it('exige confirmação por voz antes de chamar complete_onboarding no fim', () => {
    const lower = DASHBOARD_TOUR_SNIPPET.toLowerCase();
    expect(lower).toContain('complete_onboarding');
    expect(lower).toMatch(/pronto pra come[çc]ar|posso come[çc]ar/);
  });

  it('não deve chamar finish_setup (essa é papel do /onboarding, não do tour)', () => {
    expect(DASHBOARD_TOUR_SNIPPET).not.toMatch(/\bfinish_setup\b/);
  });

  it('version 1 na estreia', () => {
    expect(DASHBOARD_TOUR_SNIPPET_VERSION).toBe(1);
  });
});
