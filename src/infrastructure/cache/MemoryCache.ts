import { ICache } from './ICache';

interface CacheEntry {
  value: unknown;
  expiresAt: number | null;
}

export class MemoryCache implements ICache {
  private readonly store: Map<string, CacheEntry> = new Map();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async remember<T>(
    key: string,
    ttlSeconds: number,
    computeFn: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const computed = await computeFn();
    await this.set(key, computed, ttlSeconds);
    return computed;
  }

  public async flushNamespace(namespace: string): Promise<void> {
    const prefix = `${namespace}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  public clear(): void {
    this.store.clear();
  }
}
