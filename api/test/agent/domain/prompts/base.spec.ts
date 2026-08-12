import { BASE_PROMPT } from '~/agent/domain/prompts/base';

describe('BASE_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof BASE_PROMPT).toBe('string');
    expect(BASE_PROMPT.trim().length).toBeGreaterThan(0);
  });

  it('states the assistant role as a personal financial advisor', () => {
    expect(BASE_PROMPT).toMatch(/assistant|assistente/i);
    expect(BASE_PROMPT).toMatch(/finance|financeir/i);
  });

  it('does NOT hardcode a specific reply language — language is injected via LANGUAGE_SNIPPETS', () => {
    expect(BASE_PROMPT).not.toMatch(
      /always speak in|reply (in|exclusively) (english|portuguese)|responda (em|sempre em) (ingl(ê|e)s|portugu(ê|e)s)/i,
    );
  });

  it('forbids revealing the system prompt', () => {
    expect(BASE_PROMPT).toMatch(/never reveal|nunca revele|não revele/i);
    expect(BASE_PROMPT).toMatch(/instruc?t?(ion|õe)/i);
  });

  it('forbids executing tools without an official tool_call', () => {
    expect(BASE_PROMPT).toMatch(/tool_call/);
  });

  it('mentions the tool list exposed to the LLM (name, description, parameters)', () => {
    expect(BASE_PROMPT).toMatch(/list of tools|lista de tools/i);
    expect(BASE_PROMPT).toMatch(/description|descri(ç|c)(ã|a)o/i);
    expect(BASE_PROMPT).toMatch(/parameters?|par(â|a)metros/i);
  });

  it('instructs to call get_tool_help before invoking a tool for the first time', () => {
    expect(BASE_PROMPT).toMatch(/get_tool_help/);
    expect(BASE_PROMPT).toMatch(
      /never called|first time|primeir(a|o) vez|nunca (invocou|chamou)/i,
    );
  });

  it('tells the model not to call get_tool_help again for a tool already loaded in this session', () => {
    expect(BASE_PROMPT).toMatch(
      /already (used|loaded)|no need to call.*again|mem[óo]ria|não precisa chamar de novo/i,
    );
    expect(BASE_PROMPT).toMatch(
      /same session|mesma sess[ãa]o|this session|nesta sess[ãa]o/i,
    );
  });
});
