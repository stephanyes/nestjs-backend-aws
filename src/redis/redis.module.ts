import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { 
  REDIS_PUBLISHER_CLIENT, 
  REDIS_SUBSCRIBER_CLIENT 
} from './constants/redis.constants';
import { RedisConfig } from '../config/redis.config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_PUBLISHER_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<RedisConfig>('redis');
        
        const client = new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db,
          keyPrefix: redisConfig.keyPrefix,
          lazyConnect: redisConfig.lazyConnect,
          reconnectOnError: redisConfig.reconnectOnError,
          maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
          enableReadyCheck: redisConfig.enableReadyCheck,
          showFriendlyErrorStack: redisConfig.showFriendlyErrorStack,
        });

        client.on('connect', () => {
          console.log('📝 Redis Publisher Client connected');
        });

        client.on('error', (err) => {
          console.error('Redis Publisher Client error:', err);
        });

        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_SUBSCRIBER_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<RedisConfig>('redis');
        
        const client = new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db,
          keyPrefix: redisConfig.keyPrefix,
          lazyConnect: redisConfig.lazyConnect,
          reconnectOnError: redisConfig.reconnectOnError,
          maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
          enableReadyCheck: redisConfig.enableReadyCheck,
          showFriendlyErrorStack: redisConfig.showFriendlyErrorStack,
        });

        client.on('connect', () => {
          console.log('👂 Redis Subscriber Client connected');
        });

        client.on('error', (err) => {
          console.error('Redis Subscriber Client error:', err);
        });

        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_PUBLISHER_CLIENT, REDIS_SUBSCRIBER_CLIENT],
})
export class RedisModule {}