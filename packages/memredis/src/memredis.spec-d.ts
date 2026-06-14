import { createClient } from 'redis'

import { MemRedis } from './memredis.js'
import type { IPersistor } from './types.js'

const redisClient = createClient({ url: 'redis://localhost:6379' })
const redisPersistor: IPersistor = redisClient

const memRedisPersistor: IPersistor = new MemRedis()

void redisPersistor
void memRedisPersistor
