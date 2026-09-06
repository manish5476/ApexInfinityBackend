import Redis from 'ioredis';
import { ICache } from './ICache';
import { ILogger } from '../logging/ILogger';

export class RedisCache implements ICache {
  private readonly client: Redis;
  private readonly logger?: ILogger;
  private isConnected = false;

  constructor(redisUrl: string, logger?: ILogger) {
    this.logger = logger;
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger?.warn('[redis] Redis connection retries exceeded; continuing in degraded mode');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger?.info('[redis] Connected to Redis server');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger?.warn(`[redis] Error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      this.logger?.warn(`[redis] Failed initial connect: ${(err as Error).message}. Cache degraded.`);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const val = await this.client.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch (err) {
      this.logger?.warn(`[redis] Failed to get key ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      this.logger?.warn(`[redis] Failed to set key ${key}: ${(err as Error).message}`);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger?.warn(`[redis] Failed to del key ${key}: ${(err as Error).message}`);
    }
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
    if (!this.isConnected) return;
    try {
      const stream = this.client.scanStream({ match: `${namespace}:*` });
      const pipeline = this.client.pipeline();
      let count = 0;
      for await (const keys of stream as AsyncIterable<string[]>) {
        if (keys.length) {
          keys.forEach((k) => pipeline.del(k));
          count += keys.length;
        }
      }
      if (count > 0) {
        await pipeline.exec();
      }
    } catch (err) {
      this.logger?.warn(`[redis] Failed to flush namespace ${namespace}: ${(err as Error).message}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
    }
  }
}
