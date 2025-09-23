import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CONNECTION } from './redis.module';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CONNECTION) private readonly redis: Redis,
  ) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.set(key, jsonValue, ttl);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Erro ao fazer parse JSON do Redis:', error);
      return null;
    }
  }

  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Verifica se existe no cache
    const cached = await this.getJson<T>(key);
    if (cached) {
      return cached;
    }

    // Executa a query e salva no cache
    const result = await queryFn();
    await this.setJson(key, result, ttl);
    return result;
  }

  generateReportKey(type: string, filters?: any): string {
    const baseKey = `report:${type}`;
    if (filters) {
      const filterString = Object.entries(filters)
        .sort()
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      return `${baseKey}:${Buffer.from(filterString).toString('base64')}`;
    }
    return baseKey;
  }
}