export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_SUBSCRIBER_CLIENT = 'REDIS_SUBSCRIBER_CLIENT';
export const REDIS_PUBLISHER_CLIENT = 'REDIS_PUBLISHER_CLIENT';

export enum RedisChannels {
  BOOKS_EVENTS = 'books:events',
  BOOKS_VIEWS = 'books:views',
  BOOKS_SYNC = 'books:sync',
  BOOKS_ANALYTICS = 'books:analytics',
}
