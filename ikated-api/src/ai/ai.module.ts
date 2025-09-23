import { Module } from '@nestjs/common';
import { OpenAIService } from './openai';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class AIModule {}