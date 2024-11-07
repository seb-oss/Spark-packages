import { beforeEach } from 'node:test'
import { PubSub, type Subscription, type Topic } from '@google-cloud/pubsub'
import type { Schema } from 'avsc'
import { type MockedObject, beforeAll, describe, expect, it, vi } from 'vitest'
import { createSubscriber } from './subscriber'

type ExampleMessage = {
  messageType: string
  message: string
}

type ExamplePubsubChannels = {
  example: ExampleMessage
}

vi.mock('@google-cloud/pubsub', () => {
  const topics: { [key: string]: Topic } = {}
  const mockTopic = vi.fn().mockImplementation((name: string) => {
    if (topics[name]) {
      return topics[name]
    }

    let subscriptionExists = false
    const subscriptionMock = {
      name: 'a-subscription',
      exists: vi.fn().mockImplementation(() => [subscriptionExists]),
      on: vi.fn(),
    }

    topics[name] = {
      name,
      get: vi.fn().mockImplementation(() => [topics[name]]),
      createSubscription: vi.fn().mockImplementation(() => [subscriptionMock]),
      subscription: vi.fn().mockImplementation((name: string) => {
        if (name === 'existing-subscription') {
          subscriptionExists = true
        }

        return subscriptionMock
      }),
    } as unknown as Topic
    return topics[name]
  })

  const currentSchema = {
    get: vi.fn().mockImplementation(() => ({ revisionId: 'a-revision-id' })),
  }

  const schema = vi.fn().mockImplementation(() => {
    return currentSchema
  })

  const pubsub: Partial<PubSub> = {
    topic: mockTopic,
    createSchema: vi
      .fn()
      .mockImplementation(() => ({ id: 'first-revision-id' })),
    schema: vi
      .fn()
      .mockImplementation((name) => schema(name) as unknown as Schema),
  }

  return {
    PubSub: vi.fn().mockReturnValue(pubsub),
    SchemaTypes: {
      ProtocolBuffer: 'PROTOCOL_BUFFER',
      Avro: 'AVRO',
    },
  }
})

describe('subscriber', () => {
  const topicName = 'example'
  const subscriptionName = 'example-subscription'

  let topicMock: MockedObject<Topic>
  let subscriptionMock: MockedObject<Subscription>

  beforeAll(() => {
    topicMock = new PubSub().topic(topicName) as MockedObject<Topic>
    subscriptionMock = topicMock.subscription(
      subscriptionName
    ) as MockedObject<Subscription>
  })

  beforeEach(() => {})

  describe('subscribe', () => {
    it('uses an existing subscription if it exists', async () => {
      const subscriber = createSubscriber<ExamplePubsubChannels>({
        projectId: 'test',
      })

      topicMock.createSubscription.mockClear()

      await subscriber.topic('example').subscribe('existing-subscription', {
        onMessage: () => Promise.resolve(),
      })

      expect(topicMock.subscription).toHaveBeenCalled()
      expect(topicMock.createSubscription.mock.calls.length).toBe(0)
    })
  })

  describe('initiate', () => {
    it('does not create a subscription if it exists', async () => {
      subscriptionMock.exists.mockImplementationOnce(() => [true])

      const subscriber = createSubscriber<ExamplePubsubChannels>({
        projectId: 'test',
      })

      topicMock.createSubscription.mockClear()

      await subscriber.topic('example').initiate('existing-subscription')

      expect(topicMock.createSubscription.mock.calls.length).toBe(0)
    })

    it('creates a subscription if it does not exist', async () => {
      subscriptionMock.exists.mockImplementationOnce(() => [false])

      const subscriber = createSubscriber<ExamplePubsubChannels>({
        projectId: 'test',
      })

      topicMock.createSubscription.mockClear()

      await subscriber.topic('example').initiate('example-subscription')

      expect(topicMock.createSubscription).toHaveBeenCalled()
    })
  })
})
