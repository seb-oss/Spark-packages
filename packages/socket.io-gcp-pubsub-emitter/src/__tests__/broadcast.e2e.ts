import { PubSub, type Subscription, type Topic } from '@google-cloud/pubsub'
import { decode } from '@msgpack/msgpack'
import {
  PubSubEmulatorContainer,
  type StartedPubSubEmulatorContainer,
} from '@testcontainers/gcloud'
import type { Server } from 'socket.io'
import type { Socket } from 'socket.io-client'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest'
import { Emitter } from '../emitter'
import { connectClient, startServer, wait } from './helpers'

const PROJECT_ID = 'test-project'
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID

const IMAGE_GCLOUD = 'gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators'

let emulator: StartedPubSubEmulatorContainer
let pubsub: PubSub
let topic: Topic
let logger: Subscription
let servers: Server[]
let emitter: Emitter

beforeAll(async () => {
  emulator = await new PubSubEmulatorContainer(IMAGE_GCLOUD).withReuse().start()
  process.env.PUBSUB_EMULATOR_HOST = emulator.getEmulatorEndpoint()

  pubsub = new PubSub({ projectId: PROJECT_ID })
  topic = pubsub.topic('socket.io')
  const [exists] = await topic.exists()
  if (!exists) {
    await topic.create()
  }

  logger = pubsub.topic('socket.io').subscription('logger')
  const [subscriptionExists] = await logger.exists()
  if (!subscriptionExists) {
    await logger.create()
  }

  /*logger.on('message', (msg) => {
    console.log('----------------------------')
    console.log(msg.id)
    console.log(JSON.stringify(msg.attributes))
    console.log(JSON.stringify(decode(msg.data), null, 2))
    console.log('----------------------------')
    msg.ack()
  })*/

  servers = await Promise.all([
    startServer(3000, topic),
    startServer(3001, topic),
    startServer(3002, topic),
    startServer(3003, topic),
  ])

  emitter = new Emitter(topic)
}, 60_000)
afterAll(async () => {
  await Promise.all(servers.map((s) => s.close()))
  servers = []
  await emulator.stop()
})

let clients: (typeof Socket)[]
let listeners: Mock[]

beforeEach(async () => {
  clients = await Promise.all([
    connectClient(3000, 'r1', 'r2'),
    connectClient(3001, 'r2'),
    connectClient(3002, 'r2', 'r3'),
    connectClient(3003, 'r3'),
  ])
  listeners = [vi.fn(), vi.fn(), vi.fn(), vi.fn()]

  for (let i = 0; i < clients.length; i++) {
    clients[i].on('message', listeners[i])
  }

  await wait(100)
})
afterEach(async () => {
  for (const client of clients) {
    client.close()
  }
})

describe('emitter', () => {
  it('broadcasts to everyone', async () => {
    emitter.emit('message', 'Hello!')

    await wait(100)

    expect(listeners[0]).toHaveBeenCalledTimes(1)
    expect(listeners[0]).toHaveBeenCalledWith('Hello!')

    expect(listeners[1]).toHaveBeenCalledTimes(1)
    expect(listeners[1]).toHaveBeenCalledWith('Hello!')

    expect(listeners[2]).toHaveBeenCalledTimes(1)
    expect(listeners[2]).toHaveBeenCalledWith('Hello!')

    expect(listeners[3]).toHaveBeenCalledTimes(1)
    expect(listeners[3]).toHaveBeenCalledWith('Hello!')
  })
  it('sends to a room', async () => {
    emitter.to('r1').emit('message', 'Room1')
    emitter.to('r2').emit('message', 'Room2')
    emitter.to('r3').emit('message', 'Room3')

    await wait(200)
    expect(listeners[0]).toHaveBeenCalledWith('Room1')
    expect(listeners[0]).toHaveBeenCalledWith('Room2')
    expect(listeners[0]).not.toHaveBeenCalledWith('Room3')

    expect(listeners[1]).not.toHaveBeenCalledWith('Room1')
    expect(listeners[1]).toHaveBeenCalledWith('Room2')
    expect(listeners[1]).not.toHaveBeenCalledWith('Room3')

    expect(listeners[2]).not.toHaveBeenCalledWith('Room1')
    expect(listeners[2]).toHaveBeenCalledWith('Room2')
    expect(listeners[2]).toHaveBeenCalledWith('Room3')

    expect(listeners[3]).not.toHaveBeenCalledWith('Room1')
    expect(listeners[3]).not.toHaveBeenCalledWith('Room2')
    expect(listeners[3]).toHaveBeenCalledWith('Room3')
  })
})
