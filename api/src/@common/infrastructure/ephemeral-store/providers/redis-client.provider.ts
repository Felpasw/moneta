import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

import { env } from '../../../../config/env';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Injectable()
export class RedisClientProvider implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    this.client = new Redis(env.REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
