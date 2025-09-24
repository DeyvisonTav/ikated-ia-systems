import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

export const REDIS_CONNECTION = 'REDIS_CONNECTION';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        try {
          const redis = new Redis({
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            maxRetriesPerRequest: 3,
            connectTimeout: 10000,
            lazyConnect: false,
          });

          redis.on('connect', () => {
            console.log('✅ Redis conectado');
          });

          redis.on('error', (err) => {
            console.error('❌ Erro no Redis:', err);
          });

          return redis;
        } catch (error) {
          console.error('❌ Erro ao criar conexão Redis:', error);
          // Retorna uma instância mock para desenvolvimento
          return {
            get: () => Promise.resolve(null),
            set: () => Promise.resolve('OK'),
            del: () => Promise.resolve(1),
            exists: () => Promise.resolve(0),
          } as any;
        }
      },
    },
    {
      provide: RedisService,
      inject: [REDIS_CONNECTION],
      useFactory: (redis: Redis) => new RedisService(redis),
    },
  ],
  exports: [REDIS_CONNECTION, RedisService],
})
export class RedisModule { }