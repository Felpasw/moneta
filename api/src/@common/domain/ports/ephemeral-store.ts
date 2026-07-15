export const EPHEMERAL_STORE = Symbol('EPHEMERAL_STORE');

export interface EphemeralStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  getAndDelete<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
}
