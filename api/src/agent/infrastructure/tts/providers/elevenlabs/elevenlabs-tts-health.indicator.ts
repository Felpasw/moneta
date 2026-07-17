import { Injectable } from '@nestjs/common';

import { env } from '../../../../../config/env';
import { httpClient, isAxiosError } from '../../../../../config/http';

const ELEVENLABS_VOICES_ENDPOINT = 'https://api.elevenlabs.io/v1/voices';

@Injectable()
export class ElevenLabsTtsHealthIndicator {
  async ping(): Promise<void> {
    try {
      await httpClient.get(ELEVENLABS_VOICES_ENDPOINT, {
        headers: { 'xi-api-key': env.TTS_API_KEY },
      });
    } catch (e) {
      const status = isAxiosError(e)
        ? (e.response?.status ?? 'network_error')
        : 'unknown';
      throw new Error(`ElevenLabs TTS health check failed: HTTP ${status}`);
    }
  }
}
