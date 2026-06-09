/* istanbul ignore file */
export { MemRedis as InMemoryPersistor } from '@sebspark/memredis'
export { createCache } from './cache'
export * as serializer from './serializer'
export * as time from './time'
export type {
  Cache,
  CachingOptions,
} from './types'
