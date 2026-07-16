import { Injectable } from '@nestjs/common';
import type { Readable } from 'node:stream';

import type {
  AudioChunk,
  SynthesizeStreamParams,
  TtsClient,
  TtsVoice,
} from '~/agent/domain/ports/tts-client';
import { env } from '~/config/env';
import { httpClient } from '~/config/http';

import { ELEVENLABS_TTS } from './constants/elevenlabs-tts';
import type { ElevenLabsTtsClientOptions } from './types/elevenlabs-tts-client-options';
import { buildStreamUrl } from './utils/build-stream-url';
import { buildVoicesUrl } from './utils/build-voices-url';
import { isRetryableAxiosError } from './utils/is-retryable-axios-error';
import { normalizeAudioChunk } from './utils/normalize-audio-chunk';
import { normalizeVoice } from './utils/normalize-voice';
import { sleep } from './utils/sleep';
import { wrapTtsError } from './utils/wrap-tts-error';

@Injectable()
export class ElevenLabsTtsClient implements TtsClient {
  private readonly options: Required<ElevenLabsTtsClientOptions>;

  constructor(options: ElevenLabsTtsClientOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? ELEVENLABS_TTS.defaultMaxRetries,
      retryBackoffMs:
        options.retryBackoffMs ?? ELEVENLABS_TTS.defaultRetryBackoffMs,
    };
  }

  async *synthesizeStream(
    params: SynthesizeStreamParams,
  ): AsyncIterable<AudioChunk> {
    const response = await this.postWithRetry(params);
    for await (const chunk of response.data) {
      yield normalizeAudioChunk(chunk);
    }
  }

  async listVoices(): Promise<TtsVoice[]> {
    try {
      const response = await httpClient.get<{ voices: unknown[] }>(
        buildVoicesUrl(),
        { headers: { 'xi-api-key': env.TTS_API_KEY } },
      );
      const raw = response.data.voices as Parameters<
        typeof normalizeVoice
      >[0][];
      return raw.map(normalizeVoice);
    } catch (err) {
      throw wrapTtsError(err);
    }
  }

  private async postWithRetry(params: SynthesizeStreamParams): Promise<{
    data: Readable;
  }> {
    let attempt = 0;
    for (;;) {
      try {
        return await httpClient.post(
          buildStreamUrl(params.voiceId),
          {
            text: params.text,
            model_id: ELEVENLABS_TTS.modelId,
          },
          {
            responseType: 'stream',
            headers: {
              'xi-api-key': env.TTS_API_KEY,
              accept: 'audio/mpeg',
            },
          },
        );
      } catch (err) {
        if (attempt >= this.options.maxRetries || !isRetryableAxiosError(err)) {
          throw wrapTtsError(err);
        }
        attempt += 1;
        if (this.options.retryBackoffMs > 0) {
          await sleep(this.options.retryBackoffMs * attempt);
        }
      }
    }
  }
}
