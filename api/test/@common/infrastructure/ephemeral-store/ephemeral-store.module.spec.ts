import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type Redis from 'ioredis';

import {
  EPHEMERAL_STORE,
  type EphemeralStore,
} from '~/@common/domain/ports/ephemeral-store';
import { EphemeralStoreModule } from '~/@common/infrastructure/ephemeral-store/ephemeral-store.module';
import {
  REDIS_CLIENT,
  RedisClientProvider,
} from '~/@common/infrastructure/ephemeral-store/providers/redis-client.provider';
import { RedisEphemeralStore } from '~/@common/infrastructure/ephemeral-store/redis-ephemeral-store';

@Module({ imports: [EphemeralStoreModule] })
class ConsumerModule {}

const makeFakeRedis = () => ({
  get: jest.fn(),
  set: jest.fn(),
  getdel: jest.fn(),
  del: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
});

const makeFakeProvider = (fakeRedis: ReturnType<typeof makeFakeRedis>) => ({
  client: fakeRedis as unknown as Redis,
  onModuleDestroy: async () => {
    await fakeRedis.quit();
  },
});

describe('EphemeralStoreModule', () => {
  it('exports EPHEMERAL_STORE bound to RedisEphemeralStore', async () => {
    const fakeRedis = makeFakeRedis();
    const moduleRef = await Test.createTestingModule({
      imports: [EphemeralStoreModule],
    })
      .overrideProvider(RedisClientProvider)
      .useValue(makeFakeProvider(fakeRedis))
      .compile();

    const store = moduleRef.get<EphemeralStore>(EPHEMERAL_STORE);
    expect(store).toBeInstanceOf(RedisEphemeralStore);
  });

  it('does not export the raw REDIS_CLIENT to consumer modules (encapsulated)', async () => {
    const fakeRedis = makeFakeRedis();
    const moduleRef = await Test.createTestingModule({
      imports: [ConsumerModule],
    })
      .overrideProvider(RedisClientProvider)
      .useValue(makeFakeProvider(fakeRedis))
      .compile();

    expect(moduleRef.get<EphemeralStore>(EPHEMERAL_STORE)).toBeInstanceOf(
      RedisEphemeralStore,
    );
    expect(() =>
      moduleRef.get<Redis>(REDIS_CLIENT, { strict: true }),
    ).toThrow();
  });

  it('quits the Redis client on module destroy', async () => {
    const fakeRedis = makeFakeRedis();
    const moduleRef = await Test.createTestingModule({
      imports: [EphemeralStoreModule],
    })
      .overrideProvider(RedisClientProvider)
      .useValue(makeFakeProvider(fakeRedis))
      .compile();

    await moduleRef.close();

    expect(fakeRedis.quit).toHaveBeenCalled();
  });
});
