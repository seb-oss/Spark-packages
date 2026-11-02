import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'

/** Starts the Redis testcontainer shared by memredis e2e suites. */
export const startRedisContainer = (): Promise<StartedRedisContainer> =>
  new RedisContainer(
    'redis:8.8.4-alpine@sha256:ab669f1420eaa05360a417b24f3bd210c9272e2c79a4bb35d3e50b4bfd50dbee'
  )
    .withLabels({ package: '@sebspark/memredis' })
    .start()
