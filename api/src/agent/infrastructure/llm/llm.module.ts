import { Module } from '@nestjs/common';
import { WebSocket, type ClientOptions } from 'ws';

import { REALTIME_UPSTREAM_FACTORY } from '../../domain/ports/realtime-upstream';
import { LlmService } from './llm.service';
import { OpenAiLlmHealthIndicator } from './providers/openai/openai-llm-health.indicator';
import { OpenAiRealtimeUpstreamFactory } from './providers/openai/openai-realtime-upstream.factory';

@Module({
  providers: [
    LlmService,
    OpenAiLlmHealthIndicator,
    {
      provide: REALTIME_UPSTREAM_FACTORY,
      useFactory: () =>
        new OpenAiRealtimeUpstreamFactory(
          (url: string, options: ClientOptions) => new WebSocket(url, options),
        ),
    },
  ],
  exports: [LlmService, OpenAiLlmHealthIndicator, REALTIME_UPSTREAM_FACTORY],
})
export class LlmModule {}
