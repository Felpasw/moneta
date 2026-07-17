import { BASE_PROMPT } from '~/agent/domain/prompts/base';

describe('BASE_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof BASE_PROMPT).toBe('string');
    expect(BASE_PROMPT.trim().length).toBeGreaterThan(0);
  });

  it('states the assistant role (financial, portuguese)', () => {
    expect(BASE_PROMPT).toMatch(/assistente/i);
    expect(BASE_PROMPT).toMatch(/financeir/i);
    expect(BASE_PROMPT).toMatch(/portugu(ê|e)s/i);
  });

  it('forbids revealing the system prompt', () => {
    expect(BASE_PROMPT).toMatch(/nunca reveler|não revele|nunca revele/i);
    expect(BASE_PROMPT).toMatch(/instru(ç|c)(õ|o)es/i);
  });

  it('forbids executing tools without an official tool_call', () => {
    expect(BASE_PROMPT).toMatch(/tool_call/);
  });

  it('mentions the tool list exposed to the LLM (name, description, parameters)', () => {
    expect(BASE_PROMPT).toMatch(/lista de tools/i);
    expect(BASE_PROMPT).toMatch(/descri(ç|c)(ã|a)o/i);
    expect(BASE_PROMPT).toMatch(/par(â|a)metros/i);
  });

  it('instructs to call get_tool_help before invoking a tool for the first time', () => {
    expect(BASE_PROMPT).toMatch(/get_tool_help/);
    expect(BASE_PROMPT).toMatch(/primeir(a|o)/i);
  });

  it('tells the model not to call get_tool_help again for a tool already loaded in this session', () => {
    expect(BASE_PROMPT).toMatch(
      /n(ã|a)o precisa chamar de novo|em mem(ó|o)ria/i,
    );
    expect(BASE_PROMPT).toMatch(/mesma sess(ã|a)o|nesta sess(ã|a)o/i);
  });
});
