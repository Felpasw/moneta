import { Injectable } from '@nestjs/common';

import type {
  RealtimeConnectionConfig,
  RealtimeUpstreamProvider,
} from '../../../../domain/ports/realtime-upstream-provider';
import { env } from '../../../../../config/env';

const REALTIME_URL_BASE = 'wss://api.openai.com/v1/realtime';
const REALTIME_MODEL = 'gpt-realtime';

@Injectable()
export class OpenAiRealtimeProvider implements RealtimeUpstreamProvider {
  buildConnectionConfig(): RealtimeConnectionConfig {
    return {
      url: `${REALTIME_URL_BASE}?model=${REALTIME_MODEL}`,
      headers: {
        Authorization: `Bearer ${env.LLM_API_KEY}`,
      },
    };
  }
}
