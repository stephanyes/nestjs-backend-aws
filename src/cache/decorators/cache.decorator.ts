import { SetMetadata } from '@nestjs/common';

export interface CacheConfig {
  key?: string;           // Custom cache key
  ttl?: number;          // Time to live in seconds
  prefix?: string;       // Key prefix
  condition?: string;    // Condition to cache (e.g., 'result.length > 0')
}

export const CACHE_KEY_METADATA = 'cache_key_metadata';
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';

export const Cacheable = (config?: CacheConfig): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, config?.key || propertyKey.toString())(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, config?.ttl || 3600)(target, propertyKey, descriptor);
    
    // Store the config in the metadata
    Reflect.defineMetadata('cache:config', config || {}, target, propertyKey);
    
    return descriptor;
  };
};

export const CacheInvalidate = (patterns: string | string[]): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    Reflect.defineMetadata('cache:invalidate', patternsArray, target, propertyKey);
    return descriptor;
  };
};

export const CacheUpdate = (key: string, ttl?: number): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('cache:update', { key, ttl }, target, propertyKey);
    return descriptor;
  };
};

export const CacheKey = (): ParameterDecorator => {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    const existingKeys = Reflect.getMetadata('cache:keys', target, propertyKey) || [];
    existingKeys.push(parameterIndex);
    Reflect.defineMetadata('cache:keys', existingKeys, target, propertyKey);
  };
};