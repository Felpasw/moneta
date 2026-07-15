import { Global, Module } from '@nestjs/common';

import { EPHEMERAL_STORE } from '../../domain/ports/ephemeral-store';
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
  ],
  exports: [EPHEMERAL_STORE],
})
export class EphemeralStoreModule {}
