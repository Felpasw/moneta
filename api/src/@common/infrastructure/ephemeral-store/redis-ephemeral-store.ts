import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import type { EphemeralStore } from '../../domain/ports/ephemeral-store';
import { REDIS_CLIENT } from './providers/redis-client.provider';

@Injectable()
export class RedisEphemeralStore implements EphemeralStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return this.parse<T>(raw);
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async getAndDelete<T>(key: string): Promise<T | null> {
    const raw = await this.redis.getdel(key);
    return this.parse<T>(raw);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  private parse<T>(raw: string | null): T | null {
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }
}
