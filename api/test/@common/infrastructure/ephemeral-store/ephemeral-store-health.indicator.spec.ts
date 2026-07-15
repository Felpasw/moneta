import type Redis from 'ioredis';

import { EphemeralStoreHealthIndicator } from '~/@common/infrastructure/ephemeral-store/ephemeral-store-health.indicator';

const makeRedis = (reply: string | Error) => {
  const ping = jest.fn();
  if (reply instanceof Error) {
    ping.mockRejectedValue(reply);
  } else {
    ping.mockResolvedValue(reply);
  }
  return { ping };
};

const makeIndicator = (reply: string | Error) => {
  const redis = makeRedis(reply);
  const indicator = new EphemeralStoreHealthIndicator(
    redis as unknown as Redis,
  );
  return { indicator, redis };
};

describe('EphemeralStoreHealthIndicator', () => {
  it('resolves when Redis PING succeeds', async () => {
    const { indicator, redis } = makeIndicator('PONG');
    await expect(indicator.ping()).resolves.toBeUndefined();
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('propagates the underlying Redis error', async () => {
    const { indicator } = makeIndicator(new Error('connection refused'));
    await expect(indicator.ping()).rejects.toThrow('connection refused');
  });
});
