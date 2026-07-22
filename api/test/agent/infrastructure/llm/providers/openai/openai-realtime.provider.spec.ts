import { OpenAiRealtimeProvider } from '~/agent/infrastructure/llm/providers/openai/openai-realtime.provider';

describe('OpenAiRealtimeProvider', () => {
  const provider = new OpenAiRealtimeProvider();

  it('returns the OpenAI realtime URL with the model query and Bearer auth (no beta header)', () => {
    const config = provider.buildConnectionConfig();

    expect(config.url).toBe(
      'wss://api.openai.com/v1/realtime?model=gpt-realtime',
    );
    expect(config.headers['Authorization']).toMatch(/^Bearer /);
    expect(config.headers['Authorization'].length).toBeGreaterThan(
      'Bearer '.length,
    );
    expect(config.headers['OpenAI-Beta']).toBeUndefined();
  });
});
