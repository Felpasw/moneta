import { Readable } from 'node:stream';

import { AxiosError } from 'axios';

import { ElevenLabsTtsClient } from '~/agent/infrastructure/tts/providers/elevenlabs/elevenlabs-tts.client';
import { httpClient } from '~/config/http';

interface StreamResponse {
  readonly status: number;
  readonly data: Readable;
}

const streamOf = (chunks: readonly Buffer[]): StreamResponse => ({
  status: 200,
  data: Readable.from(chunks as Buffer[]),
});

const axios4xx = (status: number): AxiosError => {
  const error = new AxiosError(`HTTP ${status}`);
  error.response = { status } as AxiosError['response'];
  return error;
};

const axiosNoResponse = (): AxiosError => new AxiosError('Network Error');

describe('ElevenLabsTtsClient', () => {
  let postSpy: jest.SpyInstance;
  let getSpy: jest.SpyInstance;

  beforeEach(() => {
    postSpy = jest.spyOn(httpClient, 'post');
    getSpy = jest.spyOn(httpClient, 'get');
  });

  afterEach(() => {
    postSpy.mockRestore();
    getSpy.mockRestore();
  });

  const drain = async (stream: AsyncIterable<Buffer>): Promise<Buffer[]> => {
    const collected: Buffer[] = [];
    for await (const chunk of stream) collected.push(chunk);
    return collected;
  };

  it('POSTs to /v1/text-to-speech/{voiceId}/stream with xi-api-key, model_id, responseType=stream, and yields the streamed audio chunks in order', async () => {
    const chunks = [Buffer.from([1, 2, 3]), Buffer.from([4, 5, 6, 7])];
    postSpy.mockResolvedValue(streamOf(chunks));

    const client = new ElevenLabsTtsClient();
    const received = await drain(
      client.synthesizeStream({ text: 'olá', voiceId: 'voice-1' }),
    );

    expect(Buffer.concat(received).equals(Buffer.concat(chunks))).toBe(true);
    expect(postSpy).toHaveBeenCalledTimes(1);

    const calls = postSpy.mock.calls as unknown as [
      [
        string,
        Record<string, unknown>,
        { responseType: string; headers: Record<string, string> },
      ],
    ];
    const [url, body, config] = calls[0];
    expect(url).toBe(
      'https://api.elevenlabs.io/v1/text-to-speech/voice-1/stream',
    );
    expect(body).toMatchObject({
      text: 'olá',
      model_id: 'eleven_multilingual_v2',
    });
    expect(config.responseType).toBe('stream');
    expect(config.headers['xi-api-key']).toBeDefined();
    expect(config.headers['xi-api-key'].length).toBeGreaterThan(0);
  });

  it('does not retry on 4xx (single call, error propagated)', async () => {
    postSpy.mockRejectedValue(axios4xx(401));

    const client = new ElevenLabsTtsClient({ retryBackoffMs: 0 });

    await expect(
      drain(client.synthesizeStream({ text: 'x', voiceId: 'v' })),
    ).rejects.toThrow(/401/);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('retries idempotent on 5xx up to maxRetries and then throws with the last status', async () => {
    postSpy.mockRejectedValue(axios4xx(503));

    const client = new ElevenLabsTtsClient({
      retryBackoffMs: 0,
      maxRetries: 2,
    });

    await expect(
      drain(client.synthesizeStream({ text: 'x', voiceId: 'v' })),
    ).rejects.toThrow(/503/);
    expect(postSpy).toHaveBeenCalledTimes(3);
  });

  it('recovers when a retry succeeds after 5xx failures', async () => {
    const chunks = [Buffer.from('audio')];
    postSpy
      .mockRejectedValueOnce(axios4xx(502))
      .mockRejectedValueOnce(axios4xx(500))
      .mockResolvedValueOnce(streamOf(chunks));

    const client = new ElevenLabsTtsClient({
      retryBackoffMs: 0,
      maxRetries: 2,
    });
    const received = await drain(
      client.synthesizeStream({ text: 'x', voiceId: 'v' }),
    );

    expect(Buffer.concat(received).toString()).toBe('audio');
    expect(postSpy).toHaveBeenCalledTimes(3);
  });

  it('does not retry on network error (no response)', async () => {
    postSpy.mockRejectedValue(axiosNoResponse());

    const client = new ElevenLabsTtsClient({
      retryBackoffMs: 0,
      maxRetries: 3,
    });

    await expect(
      drain(client.synthesizeStream({ text: 'x', voiceId: 'v' })),
    ).rejects.toThrow(/network_error/);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('stops yielding chunks when the AbortSignal is aborted mid-stream', async () => {
    const chunks = [
      Buffer.from([1]),
      Buffer.from([2]),
      Buffer.from([3]),
      Buffer.from([4]),
    ];
    postSpy.mockResolvedValue(streamOf(chunks));

    const controller = new AbortController();
    const client = new ElevenLabsTtsClient();
    const received: Buffer[] = [];
    for await (const chunk of client.synthesizeStream({
      text: 'x',
      voiceId: 'v',
      signal: controller.signal,
    })) {
      received.push(chunk);
      if (received.length === 2) controller.abort();
    }

    expect(received.length).toBeLessThan(chunks.length);
    expect(received.length).toBeGreaterThanOrEqual(2);
  });

  describe('listVoices', () => {
    it('GETs /v1/voices with xi-api-key and normalizes { voice_id, name, labels.language } to domain shape', async () => {
      getSpy.mockResolvedValue({
        status: 200,
        data: {
          voices: [
            {
              voice_id: 'v1',
              name: 'Rachel',
              labels: { language: 'en', gender: 'female' },
            },
            {
              voice_id: 'v2',
              name: 'Carlos',
              labels: { language: 'pt' },
            },
            {
              voice_id: 'v3',
              name: 'NoLabels',
            },
          ],
        },
      });

      const client = new ElevenLabsTtsClient();
      const voices = await client.listVoices();

      expect(voices).toEqual([
        { voiceId: 'v1', name: 'Rachel', language: 'en' },
        { voiceId: 'v2', name: 'Carlos', language: 'pt' },
        { voiceId: 'v3', name: 'NoLabels' },
      ]);

      expect(getSpy).toHaveBeenCalledTimes(1);
      const calls = getSpy.mock.calls as unknown as [
        [string, { headers: Record<string, string> }],
      ];
      const [url, config] = calls[0];
      expect(url).toBe('https://api.elevenlabs.io/v1/voices');
      expect(config.headers['xi-api-key']).toBeDefined();
      expect(config.headers['xi-api-key'].length).toBeGreaterThan(0);
    });

    it('propagates HTTP errors with wrapped status message', async () => {
      getSpy.mockRejectedValue(axios4xx(401));

      const client = new ElevenLabsTtsClient();
      await expect(client.listVoices()).rejects.toThrow(/401/);
    });

    it('propagates network errors as network_error', async () => {
      getSpy.mockRejectedValue(axiosNoResponse());

      const client = new ElevenLabsTtsClient();
      await expect(client.listVoices()).rejects.toThrow(/network_error/);
    });
  });
});
