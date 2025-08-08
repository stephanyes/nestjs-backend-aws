import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL = 3600; // 1 hour default
  private readonly keyPrefix = 'cache:';

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedValue = await this.redisService.get(this.formatKey(key));
      
      if (!cachedValue) {
        return null;
      }

      const parsed = JSON.parse(cachedValue);
      
      this.logger.debug(`Cache HIT for key: ${key}`);
      return parsed as T;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    options?: CacheOptions
  ): Promise<void> {
    try {
      const ttl = options?.ttl ?? this.defaultTTL;
      const formattedKey = this.formatKey(key, options?.prefix);
      const serialized = JSON.stringify(value);

      await this.redisService.set(formattedKey, serialized, ttl);
      
      this.logger.debug(`Cache SET for key: ${key} with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}:`, error);
      // No lanzamos error para no afectar la operación principal
    }
  }

  async delete(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) 
        ? key.map(k => this.formatKey(k))
        : this.formatKey(key);

      await this.redisService.del(keys);
      
      this.logger.debug(`Cache DELETE for key(s): ${Array.isArray(key) ? key.join(', ') : key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache:`, error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      // Necesitamos usar el cliente Redis directamente para SCAN
      const formattedPattern = this.formatKey(pattern);
      
      // Por ahora usamos keys, pero en producción deberíamos usar SCAN
      // para evitar bloquear Redis TODO
      const keys = await this.scanKeys(formattedPattern);
      
      if (keys.length > 0) {
        await this.redisService.del(keys);
        this.logger.debug(`Cache DELETE pattern: ${pattern}, removed ${keys.length} keys`);
      }
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redisService.exists(this.formatKey(key));
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error checking cache existence for key ${key}:`, error);
      return false;
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      return await this.redisService.ttl(this.formatKey(key));
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  async refreshTTL(key: string, ttl?: number): Promise<void> {
    try {
      const newTTL = ttl ?? this.defaultTTL;
      await this.redisService.expire(this.formatKey(key), newTTL);
      
      this.logger.debug(`Cache TTL refreshed for key: ${key} to ${newTTL}s`);
    } catch (error) {
      this.logger.error(`Error refreshing TTL for key ${key}:`, error);
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // If not in cache, execute factory function
    const value = await factory();
    
    // Store in cache for next time
    await this.set(key, value, options);
    
    return value;
  }

  async increment(key: string, increment = 1): Promise<number> {
    try {
      const formattedKey = this.formatKey(key);
      const result = await this.redisService.hincrby(formattedKey, 'value', increment);
      
      // Set TTL if it's a new key
      const ttl = await this.redisService.ttl(formattedKey);
      if (ttl === -1) {
        await this.redisService.expire(formattedKey, this.defaultTTL);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error incrementing cache counter for key ${key}:`, error);
      return 0;
    }
  }

  async invalidateBook(bookId: string): Promise<void> {
    const keysToDelete = [
      `book:${bookId}`,
      `book:${bookId}:*`, // All related keys
    ];

    for (const pattern of keysToDelete) {
      await this.deletePattern(pattern);
    }

    // Also invalidate list caches
    await this.invalidateListCaches();
  }

  async invalidateListCaches(): Promise<void> {
    const patterns = [
      'books:all',
      'books:list:*',
      'books:author:*',
      'books:trending',
      'books:recent',
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  async invalidateAuthorCache(author: string): Promise<void> {
    await this.deletePattern(`books:author:${author}:*`);
  }

  async addToTrending(bookId: string, score?: number): Promise<void> {
    try {
      const currentTime = Date.now();
      const bookScore = score ?? currentTime;
      
      await this.redisService.zadd('trending:books', bookScore, bookId);
      
      // Keep only top 100
      await this.redisService.zremrangebyrank('trending:books', 0, -101);
      
      // Set TTL for trending list (24 hours)
      await this.redisService.expire('trending:books', 86400);
    } catch (error) {
      this.logger.error(`Error adding to trending:`, error);
    }
  }

  async getTrending(limit = 10): Promise<string[]> {
    try {
      return await this.redisService.zrevrange('trending:books', 0, limit - 1);
    } catch (error) {
      this.logger.error(`Error getting trending:`, error);
      return [];
    }
  }

  async getTrendingWithScores(limit = 10): Promise<Array<{ bookId: string; score: number }>> {
    try {
      const results = await this.redisService.zrevrangeWithScores('trending:books', 0, limit - 1);
      return results.map(r => ({ bookId: r.member, score: r.score }));
    } catch (error) {
      this.logger.error(`Error getting trending with scores:`, error);
      return [];
    }
  }

  private formatKey(key: string, prefix?: string): string {
    const fullPrefix = prefix ?? this.keyPrefix;
    return `${fullPrefix}${key}`;
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    // Por simplicidad usamos el método keys (no recomendado en producción)
    // En producción deberías implementar SCAN
    try {
      const keys: string[] = [];
      // Aquí necesitarías acceso directo al cliente Redis para hacer SCAN
      // Por ahora retornamos array vacío
      // TODO: Implementar SCAN para producción
      return keys;
    } catch (error) {
      this.logger.error(`Error scanning keys:`, error);
      return [];
    }
  }
}