import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisModule } from '../redis/redis.module';
import { CacheService } from './services/cache.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { CacheInvalidationSubscriber } from './subscribers/cache-invalidation.subscriber';

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    CacheService,
    CacheInvalidationSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}