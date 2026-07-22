import { Inject, Injectable } from '@nestjs/common';
import type { Readable } from 'node:stream';

import type {
  AudioChunk,
  SynthesizeStreamParams,
  TtsService,
  TtsVoice,
} from '~/agent/domain/ports/tts-service';
import type { TtsProvider } from '~/agent/domain/ports/tts-provider';
import { httpClient } from '~/config/http';

import { HTTP_STREAMING_TTS } from './constants/http-streaming-tts';
import { TTS_PROVIDER } from './tts.tokens';
import { isRetryableAxiosError } from './utils/is-retryable-axios-error';
import { normalizeAudioChunk } from './utils/normalize-audio-chunk';
import { sleep } from './utils/sleep';
import { wrapTtsError } from './utils/wrap-tts-error';

@Injectable()
export class HttpStreamingTtsService implements TtsService {
  private readonly maxRetries = HTTP_STREAMING_TTS.defaultMaxRetries;
  private readonly retryBackoffMs = HTTP_STREAMING_TTS.defaultRetryBackoffMs;

  constructor(@Inject(TTS_PROVIDER) private readonly provider: TtsProvider) {}

  async *synthesizeStream(
    params: SynthesizeStreamParams,
  ): AsyncIterable<AudioChunk> {
    const response = await this.postWithRetry(params);
    for await (const chunk of response.data) {
      if (params.signal?.aborted) return;
      yield normalizeAudioChunk(chunk);
    }
  }

  async listVoices(): Promise<TtsVoice[]> {
    const req = this.provider.buildListVoicesRequest();
    try {
      const response = await httpClient.get<unknown>(req.url, {
        headers: req.headers,
      });
      return this.provider.parseVoicesResponse(response.data);
    } catch (err) {
      throw wrapTtsError(err);
    }
  }

  private async postWithRetry(params: SynthesizeStreamParams): Promise<{
    data: Readable;
  }> {
    const req = this.provider.buildStreamRequest(params);
    let attempt = 0;
    for (;;) {
      try {
        return await httpClient.post(req.url, req.body, {
          responseType: 'stream',
          signal: params.signal,
          headers: req.headers,
        });
      } catch (err) {
        if (attempt >= this.maxRetries || !isRetryableAxiosError(err)) {
          throw wrapTtsError(err);
        }
        attempt += 1;
        if (this.retryBackoffMs > 0) {
          await sleep(this.retryBackoffMs * attempt);
        }
      }
    }
  }
}
