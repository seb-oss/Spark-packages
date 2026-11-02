import {
  createServer as createHttpServer,
  type Server as HttpServer,
} from 'node:http'
import { setTimeout } from 'node:timers/promises'
import type { RecordType } from '@sebspark/avsc-isometric'
import { findFreePorts } from 'find-free-ports'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '../client'
import { createServer } from '../server'

const HelloSchema = {
  type: 'record',
  name: 'Hello',
  fields: [{ name: 'greeting', type: 'string' }],
} as const satisfies RecordType

const WorldSchema = {
  type: 'record',
  name: 'World',
  fields: [{ name: 'response', type: 'string' }],
} as const satisfies RecordType

const NewsSchema = {
  type: 'record',
  name: 'News',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'headline', type: ['null', 'string'], default: null },
  ],
} as const satisfies RecordType

describe('socket.io Avro', () => {
  let port: number
  let httpServer: HttpServer

  beforeEach(async () => {
    port = (await findFreePorts(1))[0]
    httpServer = createHttpServer()
    await new Promise<void>((resolve) => httpServer.listen(port, resolve))
  })
  afterEach(async () => {
    httpServer.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      httpServer.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    )
  })

  it('works', async () => {
    const server = createServer([HelloSchema], [WorldSchema], httpServer)
    server.on('connect', (socket) => {
      socket.on('hello', ({ greeting }) => {
        socket.emit('world', { response: `You said '${greeting}'` })
      })
    })

    const uri = `http://localhost:${port}`
    const client = createClient([HelloSchema], [WorldSchema], uri)

    const listener = vi.fn()
    client.on('world', listener)
    client.emit('hello', { greeting: 'Hello!' })

    await setTimeout(100)

    expect(listener).toHaveBeenCalled()

    client.close()
    server.disconnectSockets()
  })

  it('sends payloads with nullable fields as Avro, not JSON', async () => {
    const encodingErrors = vi.spyOn(console, 'error')
    const server = createServer(
      [HelloSchema],
      [WorldSchema, NewsSchema],
      httpServer
    )
    server.on('connect', (socket) => {
      socket.on('hello', () => {
        socket.emit('news', { id: '1', headline: 'Headline' })
        socket.emit('news', { id: '2', headline: null })
      })
    })

    const uri = `http://localhost:${port}`
    const client = createClient([HelloSchema], [WorldSchema, NewsSchema], uri)

    const listener = vi.fn()
    client.on('news', listener)
    client.emit('hello', { greeting: 'Hello!' })

    await setTimeout(100)

    expect(listener.mock.calls).toEqual([
      [{ id: '1', headline: 'Headline' }],
      [{ id: '2', headline: null }],
    ])
    expect(encodingErrors).not.toHaveBeenCalled()

    encodingErrors.mockRestore()
    client.close()
    server.disconnectSockets()
  })
})
