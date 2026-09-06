/**
 * Universal Cache Interface Port.
 * Decouples domain and application layers from specific caching technology (Redis, Memory, etc.).
 */
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  remember<T>(key: string, ttlSeconds: number, computeFn: () => Promise<T>): Promise<T>;
  flushNamespace(namespace: string): Promise<void>;
}
