import { Global, Module } from '@nestjs/common';

import { EPHEMERAL_STORE } from '../../domain/ports/ephemeral-store';
import { EphemeralStoreHealthIndicator } from './ephemeral-store-health.indicator';
import {
  REDIS_CLIENT,
  RedisClientProvider,
} from './providers/redis-client.provider';
import { RedisEphemeralStore } from './redis-ephemeral-store';

@Global()
@Module({
  providers: [
    RedisClientProvider,
    {
      provide: REDIS_CLIENT,
      inject: [RedisClientProvider],
      useFactory: (provider: RedisClientProvider) => provider.client,
    },
    {
      provide: EPHEMERAL_STORE,
      useClass: RedisEphemeralStore,
    },
    EphemeralStoreHealthIndicator,
  ],
  exports: [EPHEMERAL_STORE, EphemeralStoreHealthIndicator],
})
export class EphemeralStoreModule {}
