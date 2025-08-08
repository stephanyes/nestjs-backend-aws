import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { RedisService } from '../../redis/redis.service';
import { RedisChannels } from '../../redis/constants/redis.constants';
import { 
  BookEvent, 
  BookEventPayload, 
  BookEventMetadata 
} from '../interfaces/book-event.interface';
import { BookEventType, BookEventSource } from '../constants/event-types.constants';

@Injectable()
export class BookEventPublisher {
  private readonly logger = new Logger(BookEventPublisher.name);
  private readonly version = '1.0.0';

  constructor(private readonly redisService: RedisService) {}

  async publishBookCreated(
    bookId: string,
    data: {
      title: string;
      author: string;
      publicationYear: number;
    },
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.CREATED,
      {
        bookId,
        title: data.title,
        author: data.author,
        publicationYear: data.publicationYear,
      },
      metadata
    );

    await this.publishEvent(event);
  }

  async publishBookUpdated(
    bookId: string,
    changes: Partial<{
      title: string;
      author: string;
      publicationYear: number;
      views: number;
    }>,
    previousData?: any,
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.UPDATED,
      {
        bookId,
        changes,
        previousData,
      },
      metadata
    );

    await this.publishEvent(event);
  }

  async publishBookDeleted(
    bookId: string,
    bookData?: any,
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.DELETED,
      {
        bookId,
        previousData: bookData,
      },
      metadata
    );

    await this.publishEvent(event);
  }

  async publishBatchViewed(
    bookIds: string[],
    count: number,
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.BATCH_VIEWED,
      {
        bookIds,
        changes: { count },
      },
      metadata
    );

    await Promise.all([
      this.publishEvent(event),
      this.redisService.publish(RedisChannels.BOOKS_ANALYTICS, event),
    ]);
  }

  async publishAuthorSearched(
    author: string,
    year: number,
    resultCount: number,
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.AUTHOR_SEARCHED,
      {
        author,
        publicationYear: year,
        changes: { resultCount }
      },
      metadata
    );
    
    await this.publishEvent(event);
  }

  async publishBookViewed(
    bookId: string,
    data?: {
      title?: string;
      author?: string;
      views?: number;
      userId?: string;
    },
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.VIEWED,
      {
        bookId,
        ...data,
      },
      metadata
    );

    // Publicar en ambos canales: general y específico de vistas
    await Promise.all([
      this.publishEvent(event),
      this.redisService.publish(RedisChannels.BOOKS_VIEWS, event),
    ]);
  }

  async publishBatchCreated(
    bookIds: string[],
    count: number,
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.BATCH_CREATED,
      {
        bookIds,
        changes: { count },
      },
      metadata
    );

    await this.publishEvent(event);
  }

  async publishViewsUpdated(
    bookId: string,
    views: number,
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.VIEWS_UPDATED,
      {
        bookId,
        views,
      },
      metadata
    );

    await Promise.all([
      this.publishEvent(event),
      this.redisService.publish(RedisChannels.BOOKS_ANALYTICS, event),
    ]);
  }

  async publishSyncStarted(
    source: 'postgres' | 'dynamodb',
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.SYNC_STARTED,
      {
        changes: { source },
      },
      { ...metadata, source: BookEventSource.CRON }
    );

    await Promise.all([
      this.publishEvent(event),
      this.redisService.publish(RedisChannels.BOOKS_SYNC, event),
    ]);
  }

  async publishSyncCompleted(
    stats: {
      synced: number;
      skipped: number;
      source: 'postgres' | 'dynamodb';
    },
    metadata?: Partial<BookEventMetadata>
  ): Promise<void> {
    const event = this.createEvent(
      BookEventType.SYNC_COMPLETED,
      {
        changes: stats,
      },
      { ...metadata, source: BookEventSource.CRON }
    );

    await Promise.all([
      this.publishEvent(event),
      this.redisService.publish(RedisChannels.BOOKS_SYNC, event),
    ]);
  }

  async publishBooksListed(count: number, metadata?: Partial<BookEventMetadata>): Promise<void> {
  const event = this.createEvent(
    BookEventType.LISTED,
    {
      changes: { count }
    },
    metadata
  );
  
  await this.publishEvent(event);
}

  private createEvent(
    type: BookEventType,
    payload: BookEventPayload,
    metadata?: Partial<BookEventMetadata>
  ): BookEvent {
    return {
      id: uuid(),
      type,
      timestamp: new Date(),
      payload,
      metadata: {
        source: metadata?.source || BookEventSource.API,
        version: this.version,
        correlationId: metadata?.correlationId || uuid(),
        ip: metadata?.ip,
        userAgent: metadata?.userAgent,
      },
    };
  }

  private async publishEvent(event: BookEvent): Promise<void> {
    try {
      await this.redisService.publish(RedisChannels.BOOKS_EVENTS, event);
      
      this.logger.debug(
        `Event published: ${event.type} - ${event.id} - Book: ${event.payload.bookId || 'N/A'}`
      );
    } catch (error) {
      // No lanzamos el error para no afectar la operación principal
      this.logger.error(
        `Failed to publish event ${event.type}: ${error.message}`,
        error.stack
      );
    }
  }
}