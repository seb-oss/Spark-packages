import { Topic } from '@google-cloud/pubsub'
import { createAdapter } from '@socket.io/gcp-pubsub-adapter'
import { Server } from 'socket.io'
import io, { type Socket } from 'socket.io-client'

type AdapterTopic = Parameters<typeof createAdapter>[0]

export const wait = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms))

/**
 * Repeatedly executes `fn` until it stops throwing or the timeout elapses.
 * Rethrows the last error if time runs out.
 *
 * Prefer this over a fixed `wait(ms)` when asserting on events that
 * propagate asynchronously (e.g. through the Pub/Sub emulator and
 * socket.io) — a fixed delay is either too short under CPU contention
 * or wastefully long otherwise.
 *
 * Usage:
 *   await waitFor(() => expect(spy).toHaveBeenCalled())
 */
export const waitFor = async (
  fn: () => void | Promise<void>,
  { pollingInterval = 50, timeout = 5000 } = {}
): Promise<void> => {
  const start = Date.now()
  let lastErr: unknown

  while (Date.now() - start < timeout) {
    try {
      await fn()
      return
    } catch (err) {
      lastErr = err
      await wait(pollingInterval)
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

export const startServer = (port: number, topic: Topic): Server => {
  const adapter = createAdapter(topic as unknown as AdapterTopic)
  const server = new Server().adapter(adapter)
  server.listen(port)

  server.on('connection', (socket) => {
    socket.on('join-room', (name) => {
      socket.join(name)
      // console.log(`${socket.id} joined room ${name}`)
    })
    socket.on('leave-room', (name) => {
      socket.leave(name)
      // console.log(`${socket.id} left room ${name}`)
    })
  })

  return server
}

export const connectClient = (port: number, ...rooms: string[]) =>
  new Promise<typeof Socket>((resolve) => {
    const client = io(`http://localhost:${port}`)
    client.on('connect', async () => {
      for (const room of rooms) {
        client.emit('join-room', room)
      }
      resolve(client)
    })
  })
