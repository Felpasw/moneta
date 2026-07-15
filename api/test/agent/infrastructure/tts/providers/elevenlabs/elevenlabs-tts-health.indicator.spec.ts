import { AxiosError } from 'axios';

import { ElevenLabsTtsHealthIndicator } from '~/agent/infrastructure/tts/providers/elevenlabs/elevenlabs-tts-health.indicator';
import { httpClient } from '~/config/http';

describe('ElevenLabsTtsHealthIndicator', () => {
  let httpGetSpy: jest.SpyInstance;

  beforeEach(() => {
    httpGetSpy = jest.spyOn(httpClient, 'get');
  });

  afterEach(() => {
    httpGetSpy.mockRestore();
  });

  it('resolves when ElevenLabs returns 2xx and calls the voices endpoint with xi-api-key header', async () => {
    httpGetSpy.mockResolvedValue({ status: 200, data: {} });
    const indicator = new ElevenLabsTtsHealthIndicator();

    await expect(indicator.ping()).resolves.toBeUndefined();
    expect(httpGetSpy).toHaveBeenCalledTimes(1);

    const calls = httpGetSpy.mock.calls as unknown as [
      [string, { headers: Record<string, string> }],
    ];
    const [url, config] = calls[0];
    expect(url).toBe('https://api.elevenlabs.io/v1/voices');
    expect(config.headers['xi-api-key']).toBeDefined();
    expect(config.headers['xi-api-key'].length).toBeGreaterThan(0);
  });

  it('rejects with the HTTP status when ElevenLabs returns 4xx', async () => {
    const error = new AxiosError('Unauthorized');
    error.response = { status: 401 } as AxiosError['response'];
    httpGetSpy.mockRejectedValue(error);

    const indicator = new ElevenLabsTtsHealthIndicator();
    await expect(indicator.ping()).rejects.toThrow(/401/);
  });

  it('rejects with network_error when there is no response', async () => {
    const error = new AxiosError('Network Error');
    httpGetSpy.mockRejectedValue(error);

    const indicator = new ElevenLabsTtsHealthIndicator();
    await expect(indicator.ping()).rejects.toThrow(/network_error/);
  });
});
