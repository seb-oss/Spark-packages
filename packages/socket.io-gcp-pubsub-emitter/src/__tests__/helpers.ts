import type { Topic } from '@google-cloud/pubsub'
import { createAdapter } from '@socket.io/gcp-pubsub-adapter'
import { Server } from 'socket.io'
import { io, type Socket } from 'socket.io-client'

export const wait = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms))

export const startServer = (port: number, topic: Topic) => {
  const adapter = createAdapter(topic)
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
