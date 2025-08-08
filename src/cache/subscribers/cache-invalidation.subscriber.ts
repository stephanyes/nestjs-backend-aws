import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { CacheService } from '../services/cache.service';
import { RedisChannels } from '../../redis/constants/redis.constants';
import { BookEvent } from '../../events/interfaces/book-event.interface';
import { BookEventType } from '../../events/constants/event-types.constants';

@Injectable()
export class CacheInvalidationSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheInvalidationSubscriber.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    await this.subscribeToEvents();
    this.logger.log('Cache invalidation subscriber initialized');
  }

  async onModuleDestroy() {
    await this.redisService.unsubscribe(RedisChannels.BOOKS_EVENTS);
    this.logger.log('Cache invalidation subscriber destroyed');
  }

  private async subscribeToEvents() {
    await this.redisService.subscribe(
      RedisChannels.BOOKS_EVENTS,
      async (message: string) => {
        try {
          const event: BookEvent = JSON.parse(message);
          await this.handleEvent(event);
        } catch (error) {
          this.logger.error(`Error processing event: ${error.message}`);
        }
      }
    );

    // Also subscribe to views channel for analytics
    await this.redisService.subscribe(
      RedisChannels.BOOKS_VIEWS,
      async (message: string) => {
        try {
          const event: BookEvent = JSON.parse(message);
          await this.handleViewEvent(event);
        } catch (error) {
          this.logger.error(`Error processing view event: ${error.message}`);
        }
      }
    );
  }

  private async handleEvent(event: BookEvent) {
    const { type, payload } = event;
    
    this.logger.debug(`Handling cache invalidation for event: ${type}`);

    switch (type) {
      case BookEventType.CREATED:
        await this.handleBookCreated(payload);
        break;
        
      case BookEventType.UPDATED:
        await this.handleBookUpdated(payload);
        break;
        
      case BookEventType.DELETED:
        await this.handleBookDeleted(payload);
        break;
        
      case BookEventType.BATCH_CREATED:
        await this.handleBatchCreated(payload);
        break;
        
      case BookEventType.VIEWS_UPDATED:
        await this.handleViewsUpdated(payload);
        break;
        
      case BookEventType.SYNC_COMPLETED:
        await this.handleSyncCompleted();
        break;
        
      default:
        // Other events don't need cache invalidation
        break;
    }
  }

  private async handleViewEvent(event: BookEvent) {
    const { payload } = event;
    
    if (payload.bookId) {
      // Update trending score
      await this.cacheService.addToTrending(payload.bookId);
      
      // Increment view counter in cache
      await this.cacheService.increment(`views:${payload.bookId}`);
      
      // Update "currently viewing" set (for real-time features)
      await this.updateCurrentlyViewing(payload.bookId, payload.userId);
    }
  }

  private async handleBookCreated(payload: any) {
    // Invalidate list caches
    await this.cacheService.invalidateListCaches();
    
    // Invalidate author-specific caches
    if (payload.author) {
      await this.cacheService.invalidateAuthorCache(payload.author);
    }
    
    // Pre-warm cache with the new book data
    if (payload.bookId) {
      await this.cacheService.set(
        `book:${payload.bookId}`,
        payload,
        { ttl: 3600 }
      );
    }
    
    this.logger.debug(`Cache invalidated for book created: ${payload.bookId}`);
  }

  private async handleBookUpdated(payload: any) {
    if (payload.bookId) {
      // Invalidate specific book cache
      await this.cacheService.invalidateBook(payload.bookId);
      
      // If author changed, invalidate both old and new author caches
      if (payload.changes?.author) {
        if (payload.previousData?.author) {
          await this.cacheService.invalidateAuthorCache(payload.previousData.author);
        }
        await this.cacheService.invalidateAuthorCache(payload.changes.author);
      }
      
      // Invalidate list caches
      await this.cacheService.invalidateListCaches();
      
      this.logger.debug(`Cache invalidated for book updated: ${payload.bookId}`);
    }
  }

  private async handleBookDeleted(payload: any) {
    if (payload.bookId) {
      // Invalidate specific book cache
      await this.cacheService.invalidateBook(payload.bookId);
      
      // Invalidate author cache
      if (payload.previousData?.author) {
        await this.cacheService.invalidateAuthorCache(payload.previousData.author);
      }
      
      // Invalidate list caches
      await this.cacheService.invalidateListCaches();
      
      // Remove from trending
      await this.redisService.zrem('trending:books', payload.bookId);
      
      this.logger.debug(`Cache invalidated for book deleted: ${payload.bookId}`);
    }
  }

  private async handleBatchCreated(payload: any) {
    // Invalidate all list caches
    await this.cacheService.invalidateListCaches();
    
    this.logger.debug(`Cache invalidated for batch creation: ${payload.bookIds?.length} books`);
  }

  private async handleViewsUpdated(payload: any) {
    if (payload.bookId) {
      // Only invalidate the specific book cache
      await this.cacheService.delete(`book:${payload.bookId}`);
      
      // Update trending with new view count
      if (payload.views) {
        await this.cacheService.addToTrending(payload.bookId, payload.views);
      }
      
      this.logger.debug(`Cache updated for views: ${payload.bookId}`);
    }
  }

  private async handleSyncCompleted() {
    // Clear all caches after sync
    await this.cacheService.invalidateListCaches();
    await this.cacheService.deletePattern('book:*');
    
    this.logger.warn('All caches cleared after sync completion');
  }

  private async updateCurrentlyViewing(bookId: string, userId?: string) {
    if (!userId) return;
    
    const key = `currently_viewing:${bookId}`;
    const timestamp = Date.now();
    
    // Add user to the set with timestamp as score
    await this.redisService.zadd(key, timestamp, userId);
    
    // Remove users who haven't been active in the last 5 minutes
    const fiveMinutesAgo = timestamp - (5 * 60 * 1000);
    await this.redisService.zremrangebyscore(key, '-inf', fiveMinutesAgo.toString());
    
    // Set TTL for the key (1 hour)
    await this.redisService.expire(key, 3600);
  }
}