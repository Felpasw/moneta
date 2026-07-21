import { Readable } from 'node:stream';

import { AxiosError } from 'axios';

import type {
  SynthesizeStreamParams,
  TtsVoice,
} from '~/agent/domain/ports/tts-service';
import type { TtsProvider } from '~/agent/domain/ports/tts-provider';
import { HttpStreamingTtsService } from '~/agent/infrastructure/tts/http-streaming-tts.service';
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

const buildProvider = (): TtsProvider => ({
  buildStreamRequest: (params: SynthesizeStreamParams) => ({
    url: `https://provider.test/stream/${params.voiceId}`,
    headers: { 'x-provider-key': 'stub-key' },
    body: { text: params.text },
  }),
  buildListVoicesRequest: () => ({
    url: 'https://provider.test/voices',
    headers: { 'x-provider-key': 'stub-key' },
  }),
  parseVoicesResponse: (raw: unknown): TtsVoice[] => {
    const list = (raw as { list?: TtsVoice[] }).list ?? [];
    return list;
  },
});

const drain = async (stream: AsyncIterable<Buffer>): Promise<Buffer[]> => {
  const collected: Buffer[] = [];
  for await (const chunk of stream) collected.push(chunk);
  return collected;
};

describe('HttpStreamingTtsService', () => {
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

  describe('synthesizeStream', () => {
    it('POSTs using the provider request config and yields the streamed audio chunks in order', async () => {
      const chunks = [Buffer.from([1, 2, 3]), Buffer.from([4, 5, 6, 7])];
      postSpy.mockResolvedValue(streamOf(chunks));

      const service = new HttpStreamingTtsService(buildProvider());
      const received = await drain(
        service.synthesizeStream({ text: 'olá', voiceId: 'voice-1' }),
      );

      expect(Buffer.concat(received).equals(Buffer.concat(chunks))).toBe(true);
      expect(postSpy).toHaveBeenCalledTimes(1);

      const calls = postSpy.mock.calls as unknown as [
        [
          string,
          unknown,
          { responseType: string; headers: Record<string, string> },
        ],
      ];
      const [url, body, config] = calls[0];
      expect(url).toBe('https://provider.test/stream/voice-1');
      expect(body).toEqual({ text: 'olá' });
      expect(config.responseType).toBe('stream');
      expect(config.headers['x-provider-key']).toBe('stub-key');
    });

    it('does not retry on 4xx (single call, error propagated)', async () => {
      postSpy.mockRejectedValue(axios4xx(401));

      const service = new HttpStreamingTtsService(buildProvider(), {
        retryBackoffMs: 0,
      });

      await expect(
        drain(service.synthesizeStream({ text: 'x', voiceId: 'v' })),
      ).rejects.toThrow(/401/);
      expect(postSpy).toHaveBeenCalledTimes(1);
    });

    it('retries idempotent on 5xx up to maxRetries and then throws with the last status', async () => {
      postSpy.mockRejectedValue(axios4xx(503));

      const service = new HttpStreamingTtsService(buildProvider(), {
        retryBackoffMs: 0,
        maxRetries: 2,
      });

      await expect(
        drain(service.synthesizeStream({ text: 'x', voiceId: 'v' })),
      ).rejects.toThrow(/503/);
      expect(postSpy).toHaveBeenCalledTimes(3);
    });

    it('recovers when a retry succeeds after 5xx failures', async () => {
      const chunks = [Buffer.from('audio')];
      postSpy
        .mockRejectedValueOnce(axios4xx(502))
        .mockRejectedValueOnce(axios4xx(500))
        .mockResolvedValueOnce(streamOf(chunks));

      const service = new HttpStreamingTtsService(buildProvider(), {
        retryBackoffMs: 0,
        maxRetries: 2,
      });
      const received = await drain(
        service.synthesizeStream({ text: 'x', voiceId: 'v' }),
      );

      expect(Buffer.concat(received).toString()).toBe('audio');
      expect(postSpy).toHaveBeenCalledTimes(3);
    });

    it('does not retry on network error (no response)', async () => {
      postSpy.mockRejectedValue(axiosNoResponse());

      const service = new HttpStreamingTtsService(buildProvider(), {
        retryBackoffMs: 0,
        maxRetries: 3,
      });

      await expect(
        drain(service.synthesizeStream({ text: 'x', voiceId: 'v' })),
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
      const service = new HttpStreamingTtsService(buildProvider());
      const received: Buffer[] = [];
      for await (const chunk of service.synthesizeStream({
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
  });

  describe('listVoices', () => {
    it('GETs the provider voices URL and returns whatever parseVoicesResponse yields', async () => {
      const rawResponse = { list: [{ voiceId: 'v1', name: 'Stub Voice' }] };
      getSpy.mockResolvedValue({ status: 200, data: rawResponse });

      const service = new HttpStreamingTtsService(buildProvider());
      const voices = await service.listVoices();

      expect(voices).toEqual([{ voiceId: 'v1', name: 'Stub Voice' }]);
      expect(getSpy).toHaveBeenCalledTimes(1);

      const calls = getSpy.mock.calls as unknown as [
        [string, { headers: Record<string, string> }],
      ];
      const [url, config] = calls[0];
      expect(url).toBe('https://provider.test/voices');
      expect(config.headers['x-provider-key']).toBe('stub-key');
    });

    it('wraps HTTP errors with the shared status message', async () => {
      getSpy.mockRejectedValue(axios4xx(401));

      const service = new HttpStreamingTtsService(buildProvider());
      await expect(service.listVoices()).rejects.toThrow(/401/);
    });

    it('wraps network errors as network_error', async () => {
      getSpy.mockRejectedValue(axiosNoResponse());

      const service = new HttpStreamingTtsService(buildProvider());
      await expect(service.listVoices()).rejects.toThrow(/network_error/);
    });
  });
});
