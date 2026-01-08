import { Topic } from '@google-cloud/pubsub'
import { createAdapter } from '@socket.io/gcp-pubsub-adapter'
import { Server } from 'socket.io'
import io, { type Socket } from 'socket.io-client'

type AdapterTopic = Parameters<typeof createAdapter>[0]
type Adapter = Parameters<Server['adapter']>[0]

export const wait = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms))

export const startServer = (port: number, topic: Topic) => {
  const adapter = createAdapter(topic as unknown as AdapterTopic)
  const server = new Server().adapter(adapter as unknown as Adapter)
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
  new Promise<Socket>((resolve) => {
    const client = io(`http://localhost:${port}`)
    client.on('connect', async () => {
      for (const room of rooms) {
        client.emit('join-room', room)
      }
      resolve(client)
    })
  })
