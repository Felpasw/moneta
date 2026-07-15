import type { Clock } from '../../domain/ports/clock';
import type { EphemeralStore } from '../../domain/ports/ephemeral-store';

type Entry = {
  value: unknown;
  expiresAtMs: number;
};

export class InMemoryEphemeralStore implements EphemeralStore {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly clock: Clock) {}

  async get<T>(key: string): Promise<T | null> {
    return Promise.resolve(this.readActive<T>(key));
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.entries.set(key, {
      value,
      expiresAtMs: this.clock.now().getTime() + ttlSeconds * 1000,
    });
    return Promise.resolve();
  }

  async getAndDelete<T>(key: string): Promise<T | null> {
    const value = this.readActive<T>(key);
    this.entries.delete(key);
    return Promise.resolve(value);
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
    return Promise.resolve();
  }

  private readActive<T>(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (this.clock.now().getTime() >= entry.expiresAtMs) {
      this.entries.delete(key);
      return null;
    }

    return entry.value as T;
  }
}
