import { AxiosError } from 'axios';

import { OpenAiLlmHealthIndicator } from '~/agent/infrastructure/llm/providers/openai/openai-llm-health.indicator';
import { httpClient } from '~/config/http';

describe('OpenAiLlmHealthIndicator', () => {
  let httpGetSpy: jest.SpyInstance;

  beforeEach(() => {
    httpGetSpy = jest.spyOn(httpClient, 'get');
  });

  afterEach(() => {
    httpGetSpy.mockRestore();
  });

  it('resolves when OpenAI returns 2xx and calls the models endpoint with Bearer header', async () => {
    httpGetSpy.mockResolvedValue({ status: 200, data: {} });
    const indicator = new OpenAiLlmHealthIndicator();

    await expect(indicator.ping()).resolves.toBeUndefined();
    expect(httpGetSpy).toHaveBeenCalledTimes(1);

    const calls = httpGetSpy.mock.calls as unknown as [
      [string, { headers: Record<string, string> }],
    ];
    const [url, config] = calls[0];
    expect(url).toBe('https://api.openai.com/v1/models');
    expect(config.headers.Authorization).toMatch(/^Bearer /);
  });

  it('rejects with the HTTP status when OpenAI returns 4xx', async () => {
    const error = new AxiosError('Unauthorized');
    error.response = { status: 401 } as AxiosError['response'];
    httpGetSpy.mockRejectedValue(error);

    const indicator = new OpenAiLlmHealthIndicator();
    await expect(indicator.ping()).rejects.toThrow(/401/);
  });

  it('rejects with network_error when there is no response', async () => {
    const error = new AxiosError('Network Error');
    httpGetSpy.mockRejectedValue(error);

    const indicator = new OpenAiLlmHealthIndicator();
    await expect(indicator.ping()).rejects.toThrow(/network_error/);
  });
});
