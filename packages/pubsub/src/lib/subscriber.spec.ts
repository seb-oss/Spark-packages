import { describe, it, vi, expect, type MockedObject, afterAll } from 'vitest'
import { PubSub, type Subscription, type Topic } from '@google-cloud/pubsub'
import { z } from 'zod'
import { createSubscriber } from './subscriber'
import type { Schema } from 'avsc'

const exampleSchema = z.object({
  messageType: z.string(),
  created: z.date(),
  data: z.string().optional(),
})

type ExampleMessage = z.infer<typeof exampleSchema>
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
      subscription: vi.fn().mockImplementation((name) => {
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

const description = 'This is an example message'
const zodValue = z.object(
  {
    messageType: z.string(),
    message: z.number(),
  },
  { description }
)

describe('subscriber', () => {
  const topicName = 'example'
  const subscriptionName = 'example-subscription'

  it('creates a new subscription if it does not exist', async () => {
    const topicMock = new PubSub().topic(topicName) as MockedObject<Topic>

    const subscriber = createSubscriber<ExamplePubsubChannels>({
      projectId: 'test',
    })

    await subscriber.topic('example').subscribe(subscriptionName, () => {})

    expect(topicMock.createSubscription).toHaveBeenCalled()
    expect(topicMock.createSubscription).toHaveBeenCalledWith(
      `example_${subscriptionName}`,
      expect.any(Object)
    )
  })

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

    await subscriber
      .topic('example')
      .subscribe('existing-subscription', () => {})

    expect(topicMock.subscription).toHaveBeenCalled()
    expect(topicMock.createSubscription.mock.calls.length).toBe(0)
  })
})
