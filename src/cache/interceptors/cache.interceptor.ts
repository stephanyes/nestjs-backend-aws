import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Logger } from 'pino';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../services/cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';
import { PINO_LOGGER } from 'src/libs/logger/constants/logger.constants';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger: Logger;

  constructor(
    @Inject(PINO_LOGGER) pinoLogger: Logger,
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {
    this.logger = pinoLogger.child({ context: CacheInterceptor.name });
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Check if caching is enabled for this route
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const ttl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    ) || 3600;

    const generatedKey = this.generateCacheKey(cacheKey, request);

    try {
      const cachedResponse = await this.cacheService.get(generatedKey);
      
      if (cachedResponse) {
        this.logger.debug(`Cache HIT: ${generatedKey}`);
        return of(cachedResponse);
      }
    } catch (error) {
      this.logger.error(`Cache error: ${error.message}`);
      // Continue without cache if error
    }

    // If not in cache, execute handler and cache the result
    this.logger.debug(`Cache MISS: ${generatedKey}`);
    
    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Check if we should cache this response
          if (this.shouldCache(response, context)) {
            await this.cacheService.set(generatedKey, response, { ttl });
            this.logger.debug(`Cached response for: ${generatedKey}`);
          }
        } catch (error) {
          this.logger.error(`Error caching response: ${error.message}`);
          // Don't throw, just log the error
        }
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const { params, query, body, method, url } = request;
    
    // Build cache key from request data
    const keyParts = [
      baseKey,
      method,
      url,
    ];

    // Add params to key
    if (params && Object.keys(params).length > 0) {
      keyParts.push(`params:${JSON.stringify(params)}`);
    }

    // Add query to key
    if (query && Object.keys(query).length > 0) {
      keyParts.push(`query:${JSON.stringify(query)}`);
    }

    // For POST/PUT, optionally include body (be careful with large bodies)
    if (['POST', 'PUT'].includes(method) && body) {
      const bodyHash = this.hashObject(body);
      keyParts.push(`body:${bodyHash}`);
    }

    return keyParts.join(':');
  }

  private shouldCache(response: any, context: ExecutionContext): boolean {
    if (!response) {
      return false;
    }

    // Don't cache error responses
    if (response.error || response.statusCode >= 400) {
      return false;
    }

    // Check custom condition from decorator
    const config = Reflect.getMetadata('cache:config', context.getHandler());
    if (config?.condition) {
      // Simple condition evaluation (in production, use a proper evaluator)
      try {
        if (config.condition === 'result.length > 0') {
          return Array.isArray(response) && response.length > 0;
        }
      } catch {
        // If condition fails, cache anyway
      }
    }

    return true;
  }

  private hashObject(obj: any): string {
    // Simple hash for cache key (in production, use a proper hash function)
    // TODO: review this function
    return Buffer.from(JSON.stringify(obj)).toString('base64').substring(0, 8);
  }
}