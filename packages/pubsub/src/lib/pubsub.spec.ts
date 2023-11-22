import { randomUUID } from 'crypto'
import { PubSub } from '@google-cloud/pubsub'
import {
  Mock,
  MockedObject,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

type Topics<T> = {
  'accounts.newtransaction': T
}

const createTestMessage = () => {
  const topicName: keyof Topics<''> = 'accounts.newtransaction'
  const topicData = {
    amount: 12,
    accountId: '123',
    date: new Date(),
    title: 'Transaction',
    transactionId: randomUUID(),
    transactionType: 'CARD_PURCHASE',
    userId: randomUUID(),
  }

  return {
    topicName,
    topicData,
  }
}

vi.mock('@google-cloud/pubsub', () => {
  const pubsub: Partial<PubSub> = {
    topic: vi.fn(),
  }

  return {
    PubSub: vi.fn().mockReturnValue(pubsub),
  }
})

let subscriberFn: (args: { ack: Mock; nack: Mock; data: string }) => void

const setup = async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)

  const testMessage = createTestMessage()
  const mockTopic = {
    name: 'mocked-topic',
    get: vi.fn(),
    publishMessage: vi.fn(),
    subscription: vi.fn(),
    createSubscription: vi.fn(),
  }
  const subscription = {
    get: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }

  const mockConfig = {
    projectId: 'test-project-id',
    credentials: {
      client_email: 'test-client-email',
      private_key: '----- BEGIN ------\ntest-private-key\n----- END ------\n',
    },
  }

  mockTopic.get.mockImplementation(async () => [mockTopic])
  mockTopic.publishMessage.mockImplementation(async () => 'ok')
  mockTopic.createSubscription.mockImplementation(async () => [subscription])
  mockTopic.subscription.mockImplementation(() => subscription)

  subscription.get.mockImplementation(async () => [subscription])
  subscription.on.mockImplementation(
    (name: string, cb: (...args: unknown[]) => void) => {
      if (name === 'push-message') subscriberFn = cb
      if (name === 'message') subscriberFn = cb
      return subscription
    }
  )

  const pubsub = new PubSub() as MockedObject<PubSub>
  const { createPubsub } = await import('./pubsub')
  const createdPubsub = createPubsub<
    Topics<typeof testMessage.topicData>,
    'test'
  >()
  ;(pubsub.topic as Mock).mockReturnValue(mockTopic)

  return {
    ack: vi.fn(),
    nack: vi.fn(),
    createdPubsub,
    mockTopic,
    subscription,
    pubsub,
    mockConfig,
    ...testMessage,
  }
}

beforeAll(() => {
  process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL = 'test@example.com'
  process.env.PUBSUB_DELIVERY_MODE = 'push'
  process.env.PUBSUB_PUSH_HOST = 'http://localhost:8080'
})

afterAll(() => {
  process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL = undefined
  process.env.PUBSUB_DELIVERY_MODE = undefined
  process.env.PUBSUB_PUSH_HOST = undefined
})

describe('creates an instance of PubSub', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('without configuration', () => {
    it('when publishing', async () => {
      const { createdPubsub, topicData, topicName } = await setup()

      await createdPubsub.topic(topicName).publish(topicData)

      expect(PubSub).toHaveBeenCalledTimes(2)
    })

    it('when subscribing', async () => {
      const { createdPubsub, topicName } = await setup()

      await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })

      expect(PubSub).toHaveBeenCalledTimes(2)
    })

    it('when subscribing to multiple', async () => {
      const { createdPubsub, topicName } = await setup()

      createdPubsub.subscribeToMultipleAs('test').subscribe(topicName, {
        onSuccess: () => undefined,
        onError: () => undefined,
      })

      expect(PubSub).toHaveBeenCalledTimes(2)
      expect(PubSub).toHaveBeenCalledWith()
    })
  })

  describe('with projectId when passed config', () => {
    it('when publishing', async () => {
      const { createdPubsub, mockConfig, topicData, topicName } = await setup()

      await createdPubsub.topic(topicName, mockConfig).publish(topicData)

      expect(PubSub).toHaveBeenLastCalledWith({
        projectId: mockConfig.projectId,
        credentials: {
          client_email: mockConfig.credentials.client_email,
          private_key: mockConfig.credentials.private_key,
        },
      })
    })

    it('when subscribing', async () => {
      const { createdPubsub, mockConfig, topicName } = await setup()

      await createdPubsub.topic(topicName, mockConfig).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })

      expect(PubSub).toHaveBeenCalledWith({
        projectId: mockConfig.projectId,
        credentials: {
          client_email: mockConfig.credentials.client_email,
          private_key: mockConfig.credentials.private_key,
        },
      })
    })
  })
})

describe('#topic', () => {
  it('calls topic.get on pubsub', async () => {
    const { createdPubsub, pubsub, mockTopic, topicData, topicName } =
      await setup()

    await createdPubsub.topic(topicName).publish(topicData)

    expect(pubsub.topic).toHaveBeenCalledWith('accounts.newtransaction')
    expect(mockTopic.get).toHaveBeenCalledWith({ autoCreate: true })
  })

  describe('publish', () => {
    it('calls publishMessage', async () => {
      const { createdPubsub, mockTopic, topicData, topicName } = await setup()

      await createdPubsub.topic(topicName).publish(topicData)

      expect(mockTopic.publishMessage).toHaveBeenCalledTimes(1)
    })

    it('serialises the message', async () => {
      const { createdPubsub, mockTopic, topicData, topicName } = await setup()
      const headers = { identity: 'test' }
      const data = Buffer.from(JSON.stringify({ message: topicData, headers }))

      await createdPubsub.topic(topicName).publish(topicData, headers)

      expect(mockTopic.publishMessage).toHaveBeenCalledWith({ data })
    })

    it('serialises the message unwrapped when passed raw', async () => {
      const { createdPubsub, mockTopic, topicData, topicName } = await setup()
      const headers = { identity: 'test' }
      const data = Buffer.from(JSON.stringify(topicData))

      await createdPubsub.topic(topicName).publish(topicData, headers, true)

      expect(mockTopic.publishMessage).toHaveBeenCalledWith({ data })
    })

    it('returns the result', async () => {
      const { createdPubsub, topicData, topicName } = await setup()
      const result = await createdPubsub.topic(topicName).publish(topicData)

      expect(result).toEqual('ok')
    })
  })

  describe('subscribe', () => {
    it('creates a subscription using topic.createSubscription', async () => {
      const { createdPubsub, mockTopic, topicName } = await setup()

      await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })

      expect(mockTopic.createSubscription).toHaveBeenCalledWith(
        `${topicName}.test`,
        {
          pushConfig: expect.objectContaining({
            pushEndpoint: expect.stringMatching(
              'http://localhost:8080/pubsub/push'
            ),
          }),
          retryPolicy: {
            minimumBackoff: {
              seconds: expect.any(Number),
            },
            maximumBackoff: {
              seconds: expect.any(Number),
            },
          },
          deadLetterPolicy: {
            deadLetterTopic: 'mocked-topic',
            maxDeliveryAttempts: expect.any(Number),
          },
        }
      )
    })

    it('retrieves the existing subscription if it already exists', async () => {
      const { createdPubsub, mockTopic, topicName, subscription } =
        await setup()
      mockTopic.createSubscription.mockRejectedValue(
        new Error('6 ALREADY_EXISTS: Subscription already exists') as never
      )

      await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })

      expect(mockTopic.subscription).toHaveBeenCalledWith(`${topicName}.test`)
      expect(subscription.get).toHaveBeenCalledWith()
    })

    it('subscribes', async () => {
      const { createdPubsub, topicName, subscription } = await setup()
      await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })

      expect(subscription.on).toHaveBeenCalledWith(
        'push-message',
        expect.any(Function)
      )
      expect(subscription.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      )
    })

    it('unsubscribes', async () => {
      const { createdPubsub, topicName, subscription } = await setup()
      const unsubscribe = await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })
      unsubscribe()

      expect(subscription.off).toHaveBeenCalledWith(
        'push-message',
        expect.any(Function)
      )
      expect(subscription.off).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      )
    })

    describe('ack and nacking', () => {
      it('acks after completed', async () => {
        const { createdPubsub, topicName, ack, nack } = await setup()

        await createdPubsub.topic(topicName).subscribe({
          subscriberName: 'test',
          onSuccess: () => undefined,
        })

        await subscriberFn({
          ack,
          nack,
          data: JSON.stringify({ data: 'hello' }),
        })

        expect(ack).toHaveBeenCalledTimes(1)
        expect(nack).toHaveBeenCalledTimes(0)
      })

      it('acks after completed (promise)', async () => {
        const { createdPubsub, topicName, ack, nack } = await setup()

        await createdPubsub.topic(topicName).subscribe({
          subscriberName: 'test',
          onSuccess: async () => undefined,
        })

        await subscriberFn({
          ack,
          nack,
          data: JSON.stringify({ data: 'hello' }),
        })

        expect(ack).toHaveBeenCalledTimes(1)
        expect(nack).toHaveBeenCalledTimes(0)
      })

      it('nacks when throw', async () => {
        const { createdPubsub, topicName, ack, nack } = await setup()

        await createdPubsub.topic(topicName).subscribe({
          subscriberName: 'test',
          onSuccess: () => {
            throw new Error('Did not work')
          },
        })

        await subscriberFn({
          ack,
          nack,
          data: JSON.stringify({ data: 'hello' }),
        })

        expect(ack).toHaveBeenCalledTimes(0)
        expect(nack).toHaveBeenCalledTimes(1)
      })

      it('nacks when throw (promise)', async () => {
        const { createdPubsub, topicName, ack, nack } = await setup()

        await createdPubsub.topic(topicName).subscribe({
          subscriberName: 'test',
          onSuccess: async () => {
            throw new Error('Did not work')
          },
        })

        await subscriberFn({
          ack,
          nack,
          data: JSON.stringify({ data: 'hello' }),
        })

        expect(ack).toHaveBeenCalledTimes(0)
        expect(nack).toHaveBeenCalledTimes(1)
      })
    })
  })
  describe('pull delivery mode', () => {
    beforeEach(() => {
      process.env.PUBSUB_DELIVERY_MODE = 'pull'
    })

    afterEach(() => {
      process.env.PUBSUB_DELIVERY_MODE = undefined
    })

    it('creates a subscription using topic.createSubscription', async () => {
      const { createdPubsub, mockTopic, topicName } = await setup()

      await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })

      expect(mockTopic.createSubscription).toHaveBeenCalledWith(
        `${topicName}.test`,
        {
          retryPolicy: {
            minimumBackoff: {
              seconds: expect.any(Number),
            },
            maximumBackoff: {
              seconds: expect.any(Number),
            },
          },
          deadLetterPolicy: {
            deadLetterTopic: 'mocked-topic',
            maxDeliveryAttempts: expect.any(Number),
          },
        }
      )
    })

    it('retrieves the existing subscription if it already exists', async () => {
      const { createdPubsub, mockTopic, topicName, subscription } =
        await setup()

      mockTopic.createSubscription.mockRejectedValue(
        new Error('6 ALREADY_EXISTS: Subscription already exists') as never
      )

      await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })

      expect(mockTopic.subscription).toHaveBeenCalledWith(`${topicName}.test`)
      expect(subscription.get).toHaveBeenCalledWith()
    })

    it('subscribes', async () => {
      const { createdPubsub, topicName, subscription } = await setup()

      await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })

      expect(subscription.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      )
      expect(subscription.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      )
    })

    it('unsubscribes', async () => {
      const { createdPubsub, topicName, subscription } = await setup()

      const unsubscribe = await createdPubsub.topic(topicName).subscribe({
        subscriberName: 'test',
        onSuccess: () => undefined,
      })
      unsubscribe()

      expect(subscription.off).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      )
      expect(subscription.off).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      )
    })

    describe('ack and nacking', () => {
      it('acks after completed', async () => {
        const { createdPubsub, topicName, ack, nack } = await setup()

        await createdPubsub.topic(topicName).subscribe({
          subscriberName: 'test',
          onSuccess: () => undefined,
        })

        await subscriberFn({
          ack,
          nack,
          data: JSON.stringify({ data: 'hello' }),
        })

        expect(ack).toHaveBeenCalledTimes(1)
        expect(nack).toHaveBeenCalledTimes(0)
      })

      it('acks after completed (promise)', async () => {
        const { createdPubsub, topicName, ack, nack } = await setup()

        await createdPubsub.topic(topicName).subscribe({
          subscriberName: 'test',
          onSuccess: async () => undefined,
        })

        await subscriberFn({
          ack,
          nack,
          data: JSON.stringify({ data: 'hello' }),
        })

        expect(ack).toHaveBeenCalledTimes(1)
        expect(nack).toHaveBeenCalledTimes(0)
      })

      it('nacks when throw', async () => {
        const { createdPubsub, topicName, ack, nack } = await setup()

        await createdPubsub.topic(topicName).subscribe({
          subscriberName: 'test',
          onSuccess: () => {
            throw new Error('Did not work')
          },
        })

        await subscriberFn({
          ack,
          nack,
          data: JSON.stringify({ data: 'hello' }),
        })

        expect(ack).toHaveBeenCalledTimes(0)
        expect(nack).toHaveBeenCalledTimes(1)
      })

      it('nacks when throw (promise)', async () => {
        const { createdPubsub, topicName, ack, nack } = await setup()

        await createdPubsub.topic(topicName).subscribe({
          subscriberName: 'test',
          onSuccess: async () => {
            throw new Error('Did not work')
          },
        })

        await subscriberFn({
          ack,
          nack,
          data: JSON.stringify({ data: 'hello' }),
        })

        expect(ack).toHaveBeenCalledTimes(0)
        expect(nack).toHaveBeenCalledTimes(1)
      })
    })
  })
})
