import { PubSub, type Subscription, type Topic } from '@google-cloud/pubsub'
import type { Schema } from 'avsc'
import { type MockedObject, afterAll, describe, expect, it, vi } from 'vitest'
import { createSubscriber } from './subscriber'

type ExampleMessage = {
  messageType: string
  message: string
}

const message = {
  messageType: 'type of message',
  message: 'message data',
} satisfies ExampleMessage

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

  it('uses an existing subscription if it exists', async () => {
    const topicMock = new PubSub().topic(topicName) as MockedObject<Topic>
    const subscriptionMock = topicMock.subscription(
      subscriptionName
    ) as MockedObject<Subscription>

    subscriptionMock.exists.mockImplementation(() => [true])

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
