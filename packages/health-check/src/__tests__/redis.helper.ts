import net from 'node:net'
import { performance } from 'node:perf_hooks'
import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'

export const startRedis = async () =>
  new RedisContainer(
    'redis:8.8.4-alpine@sha256:ab669f1420eaa05360a417b24f3bd210c9272e2c79a4bb35d3e50b4bfd50dbee'
  ).start()

export const pingRedis = (redis: StartedRedisContainer, timeoutMs = 1500) =>
  new Promise<number>((resolve, reject) => {
    const start = performance.now()
    const socket = new net.Socket()
    let done = false

    const finish = (err: Error | null, ms?: number) => {
      if (done) return
      done = true
      socket.destroy()

      if (err) {
        reject(err)
      } else {
        resolve(ms as number)
      }
    }

    socket.setTimeout(timeoutMs)
    socket.once('timeout', () => finish(new Error('timeout')))
    socket.once('error', (err) => finish(err))

    socket.connect(redis.getPort(), redis.getHost(), () => {
      socket.write('PING\r\n')
    })

    socket.on('data', (buf) => {
      // Simple RESP check: "+PONG\r\n"
      const txt = buf.toString('utf8')
      if (txt.startsWith('+PONG')) finish(null, performance.now() - start)
      else finish(new Error('error'))
    })
  })
