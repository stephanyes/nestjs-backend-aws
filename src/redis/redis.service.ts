import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { 
  REDIS_PUBLISHER_CLIENT, 
  REDIS_SUBSCRIBER_CLIENT,
  RedisChannels 
} from './constants/redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_PUBLISHER_CLIENT) private readonly publisherClient: Redis,
    @Inject(REDIS_SUBSCRIBER_CLIENT) private readonly subscriberClient: Redis,
  ) {}

  async onModuleDestroy() {
    await Promise.all([
      this.publisherClient.quit(),
      this.subscriberClient.quit(),
    ]);
  }

  async publish(channel: RedisChannels | string, message: any): Promise<number> {
    try {
      const payload = typeof message === 'string' 
        ? message 
        : JSON.stringify(message);
      
      const result = await this.publisherClient.publish(channel, payload);
      
      this.logger.debug(`Published to ${channel}: ${payload.substring(0, 100)}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Error publishing to ${channel}:`, error);
      throw error;
    }
  }

  async subscribe(
    channel: RedisChannels | string, 
    callback: (message: string) => void
  ): Promise<void> {
    try {
      await this.subscriberClient.subscribe(channel);
      
      this.subscriberClient.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
      
      this.logger.log(`Subscribed to channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Error subscribing to ${channel}:`, error);
      throw error;
    }
  }

  async subscribeMultiple(
    channels: (RedisChannels | string)[], 
    callback: (channel: string, message: string) => void
  ): Promise<void> {
    try {
      await this.subscriberClient.subscribe(...channels);
      
      this.subscriberClient.on('message', (channel, message) => {
        callback(channel, message);
      });
      
      this.logger.log(`Subscribed to channels: ${channels.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error subscribing to multiple channels:`, error);
      throw error;
    }
  }

  async unsubscribe(channel: RedisChannels | string): Promise<void> {
    try {
      await this.subscriberClient.unsubscribe(channel);
      this.logger.log(`Unsubscribed from channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Error unsubscribing from ${channel}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.publisherClient.get(key);
  }

  async set(
    key: string, 
    value: string | number | Buffer, 
    ttlSeconds?: number
  ): Promise<'OK'> {
    if (ttlSeconds) {
      return this.publisherClient.setex(key, ttlSeconds, value);
    }
    return this.publisherClient.set(key, value);
  }

  async del(key: string | string[]): Promise<number> {
    if (Array.isArray(key)) {
      return this.publisherClient.del(...key);
    }
    return this.publisherClient.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.publisherClient.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.publisherClient.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.publisherClient.ttl(key);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.publisherClient.zadd(key, score, member);
  }

  async zincrby(key: string, increment: number, member: string): Promise<string> {
    return this.publisherClient.zincrby(key, increment, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.publisherClient.zrange(key, start, stop);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.publisherClient.zrevrange(key, start, stop);
  }

  async zrevrangeWithScores(
    key: string, 
    start: number, 
    stop: number
  ): Promise<Array<{ member: string; score: number }>> {
    const result = await this.publisherClient.zrevrange(key, start, stop, 'WITHSCORES');
    const items: Array<{ member: string; score: number }> = [];
    
    for (let i = 0; i < result.length; i += 2) {
      items.push({
        member: result[i],
        score: parseFloat(result[i + 1]),
      });
    }
    
    return items;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.publisherClient.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.publisherClient.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.publisherClient.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.publisherClient.hdel(key, ...fields);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.publisherClient.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.publisherClient.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    return this.publisherClient.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return this.publisherClient.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.publisherClient.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return this.publisherClient.llen(key);
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
  return this.publisherClient.hincrby(key, field, increment);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    return this.publisherClient.zrem(key, ...members);
  }

  async zremrangebyscore(key: string, min: string, max: string): Promise<number> {
    return this.publisherClient.zremrangebyscore(key, min, max);
  }

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    return this.publisherClient.zremrangebyrank(key, start, stop);
  }
}