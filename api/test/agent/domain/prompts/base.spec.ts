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
});
