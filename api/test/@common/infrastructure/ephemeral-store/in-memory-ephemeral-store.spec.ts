import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';
import { InMemoryEphemeralStore } from '~/@common/infrastructure/ephemeral-store/in-memory-ephemeral-store';

const START = new Date('2026-01-01T00:00:00.000Z');

const makeStore = () => {
  const clock = new FixedClock(START);
  const store = new InMemoryEphemeralStore(clock);
  return { store, clock };
};

describe('InMemoryEphemeralStore', () => {
  describe('set / get', () => {
    it('returns the stored value before TTL elapses', async () => {
      const { store } = makeStore();

      await store.set('k', { userId: 'u-1' }, 60);

      expect(await store.get<{ userId: string }>('k')).toEqual({
        userId: 'u-1',
      });
    });

    it('returns null when key was never set', async () => {
      const { store } = makeStore();

      expect(await store.get('missing')).toBeNull();
    });

    it('returns null after TTL elapses', async () => {
      const { store, clock } = makeStore();
      await store.set('k', 'v', 60);

      clock.advance(60_000);

      expect(await store.get('k')).toBeNull();
    });

    it('still returns the value 1ms before TTL', async () => {
      const { store, clock } = makeStore();
      await store.set('k', 'v', 60);

      clock.advance(60_000 - 1);

      expect(await store.get('k')).toBe('v');
    });

    it('overwrites existing entry with new TTL', async () => {
      const { store, clock } = makeStore();
      await store.set('k', 'old', 10);
      clock.advance(5_000);

      await store.set('k', 'new', 20);
      clock.advance(15_000);

      expect(await store.get('k')).toBe('new');
    });
  });

  describe('getAndDelete', () => {
    it('returns value and removes the key atomically', async () => {
      const { store } = makeStore();
      await store.set('k', 'v', 60);

      expect(await store.getAndDelete<string>('k')).toBe('v');
      expect(await store.get('k')).toBeNull();
    });

    it('returns null on second call (single-use)', async () => {
      const { store } = makeStore();
      await store.set('k', 'v', 60);

      await store.getAndDelete('k');

      expect(await store.getAndDelete('k')).toBeNull();
    });

    it('returns null when TTL already expired', async () => {
      const { store, clock } = makeStore();
      await store.set('k', 'v', 60);
      clock.advance(60_000);

      expect(await store.getAndDelete('k')).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes an existing key', async () => {
      const { store } = makeStore();
      await store.set('k', 'v', 60);

      await store.delete('k');

      expect(await store.get('k')).toBeNull();
    });

    it('is a no-op on missing key', async () => {
      const { store } = makeStore();

      await expect(store.delete('missing')).resolves.toBeUndefined();
    });
  });
});
