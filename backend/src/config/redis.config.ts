import { Injectable } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';

/**
 * Redis Cache Service
 * Manages connection to Redis for caching and session storage
 */
@Injectable()
export class RedisService {
  private client: RedisClientType;

  async onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');
    const password = process.env.REDIS_PASSWORD;
    const db = parseInt(process.env.REDIS_DB || '0');

    const credentials = password ? `:${password}@` : '';
    const url = `redis://${credentials}${host}:${port}/${db}`;

    this.client = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (err) =>
      console.error('Redis Client Error:', err),
    );
    this.client.on('connect', () =>
      console.log('✓ Redis connected'),
    );

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value as string) : null;
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.client.setEx(
      key,
      ttlSeconds || 3600,
      JSON.stringify(value),
    );
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }
}
