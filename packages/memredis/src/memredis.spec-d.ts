import { createClient } from 'redis'
import { test } from 'vitest'

import { MemRedis } from './memredis.js'
import type { IPersistor } from './types.js'

test('redis client and MemRedis are both assignable to IPersistor', () => {
  const redisClient = createClient({ url: 'redis://localhost:6379' })
  const redisPersistor: IPersistor = redisClient

  const memRedisPersistor: IPersistor = new MemRedis()

  void redisPersistor
  void memRedisPersistor
})
