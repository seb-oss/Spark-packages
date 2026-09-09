import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'

/** Starts the Redis testcontainer shared by memredis e2e suites. */
export const startRedisContainer = (): Promise<StartedRedisContainer> =>
  new RedisContainer('redis:8-alpine')
    .withLabels({ package: '@sebspark/memredis' })
    .start()
