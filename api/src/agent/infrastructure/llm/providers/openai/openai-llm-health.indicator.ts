import { Injectable } from '@nestjs/common';

import { env } from '../../../../../config/env';
import { httpClient, isAxiosError } from '../../../../../config/http';

const OPENAI_MODELS_ENDPOINT = 'https://api.openai.com/v1/models';

@Injectable()
export class OpenAiLlmHealthIndicator {
  async ping(): Promise<void> {
    try {
      await httpClient.get(OPENAI_MODELS_ENDPOINT, {
        headers: { Authorization: `Bearer ${env.LLM_API_KEY}` },
      });
    } catch (e) {
      const status = isAxiosError(e)
        ? (e.response?.status ?? 'network_error')
        : 'unknown';
      throw new Error(`OpenAI LLM health check failed: HTTP ${status}`);
    }
  }
}
