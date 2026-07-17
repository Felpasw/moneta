import { Module } from '@nestjs/common';
import { WebSocket, type ClientOptions } from 'ws';

import { REALTIME_UPSTREAM_FACTORY } from '../../domain/ports/realtime-upstream';
import {
  REALTIME_UPSTREAM_PROVIDER,
  type RealtimeUpstreamProvider,
} from '../../domain/ports/realtime-upstream-provider';
import { OpenAiLlmHealthIndicator } from './providers/openai/openai-llm-health.indicator';
import { OpenAiRealtimeProvider } from './providers/openai/openai-realtime.provider';
import { WsRealtimeUpstreamFactory } from './ws-realtime-upstream.factory';

@Module({
  providers: [
    OpenAiLlmHealthIndicator,
    {
      provide: REALTIME_UPSTREAM_PROVIDER,
      useClass: OpenAiRealtimeProvider,
    },
    {
      provide: REALTIME_UPSTREAM_FACTORY,
      useFactory: (provider: RealtimeUpstreamProvider) =>
        new WsRealtimeUpstreamFactory(
          provider,
          (url: string, options: ClientOptions) => new WebSocket(url, options),
        ),
      inject: [REALTIME_UPSTREAM_PROVIDER],
    },
  ],
  exports: [OpenAiLlmHealthIndicator, REALTIME_UPSTREAM_FACTORY],
})
export class LlmModule {}
