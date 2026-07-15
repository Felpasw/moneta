import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from './providers/redis-client.provider';

@Injectable()
export class EphemeralStoreHealthIndicator {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async ping(): Promise<void> {
    await this.redis.ping();
  }
}
