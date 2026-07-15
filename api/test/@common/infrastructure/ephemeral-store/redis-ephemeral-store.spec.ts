import { RedisEphemeralStore } from '~/@common/infrastructure/ephemeral-store/redis-ephemeral-store';

type RedisMock = {
  get: jest.Mock;
  set: jest.Mock;
  getdel: jest.Mock;
  del: jest.Mock;
};

const makeRedis = (): RedisMock => ({
  get: jest.fn(),
  set: jest.fn(),
  getdel: jest.fn(),
  del: jest.fn(),
});

describe('RedisEphemeralStore', () => {
  it('set serializes value and passes TTL via EX', async () => {
    const redis = makeRedis();
    const store = new RedisEphemeralStore(redis as never);

    await store.set('password_reset:abc', { userId: 'u-1' }, 900);

    expect(redis.set).toHaveBeenCalledWith(
      'password_reset:abc',
      JSON.stringify({ userId: 'u-1' }),
      'EX',
      900,
    );
  });

  it('get parses JSON and returns typed value', async () => {
    const redis = makeRedis();
    redis.get.mockResolvedValue(JSON.stringify({ userId: 'u-1' }));
    const store = new RedisEphemeralStore(redis as never);

    const result = await store.get<{ userId: string }>('k');

    expect(redis.get).toHaveBeenCalledWith('k');
    expect(result).toEqual({ userId: 'u-1' });
  });

  it('get returns null when redis has no value', async () => {
    const redis = makeRedis();
    redis.get.mockResolvedValue(null);
    const store = new RedisEphemeralStore(redis as never);

    expect(await store.get('missing')).toBeNull();
  });

  it('getAndDelete uses GETDEL (atomic single-use)', async () => {
    const redis = makeRedis();
    redis.getdel.mockResolvedValue(JSON.stringify({ userId: 'u-1' }));
    const store = new RedisEphemeralStore(redis as never);

    const result = await store.getAndDelete<{ userId: string }>('token');

    expect(redis.getdel).toHaveBeenCalledWith('token');
    expect(result).toEqual({ userId: 'u-1' });
  });

  it('getAndDelete returns null when key already consumed / expired', async () => {
    const redis = makeRedis();
    redis.getdel.mockResolvedValue(null);
    const store = new RedisEphemeralStore(redis as never);

    expect(await store.getAndDelete('gone')).toBeNull();
  });

  it('delete forwards to DEL', async () => {
    const redis = makeRedis();
    const store = new RedisEphemeralStore(redis as never);

    await store.delete('k');

    expect(redis.del).toHaveBeenCalledWith('k');
  });
});
