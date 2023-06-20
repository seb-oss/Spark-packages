import { PubSub, Subscription, Topic } from '@google-cloud/pubsub'
import { createPubsub } from './pubsub'

import { randomUUID } from 'crypto'

// TODO: Create a TopicName for testing

// import { TopicName } from '@sebneo/common/messages'
// import { Transaction } from '@sebneo/schemas/neo-core-accounts'
// const pubsub = createPubsub<>()

import { create } from 'domain'

const createTestMessage = () => {
  const topicName: TopicName = 'accounts.newtransaction'
  const data: Transaction = {
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
    data,
  }
}

jest.mock('@google-cloud/pubsub', () => {
  const pubsub: Partial<PubSub> = {
    topic: jest.fn(),
  }

  return {
    PubSub: jest.fn().mockReturnValue(pubsub),
  }
})

describe('pubsub', () => {
  let pubsub: jest.MockedObject<PubSub>
  const { data: topicData, topicName } = createTestMessage()
  beforeEach(() => {
    pubsub = new PubSub() as jest.MockedObject<PubSub>
  })
  it('creates an instance of PubSub', () => {
    expect(PubSub).toHaveBeenCalled()
  })
  describe('topic', () => {
    let mockTopic: jest.MockedObject<Topic>
    beforeEach(() => {
      const partialTopic: Partial<Topic> = {
        name: 'mocked-topic',
        get: jest.fn(),
        publishMessage: jest.fn(),
        subscription: jest.fn(),
        createSubscription: jest.fn(),
      }
      mockTopic = partialTopic as jest.MockedObject<Topic>
      mockTopic.get.mockImplementation(async () => [mockTopic])
      pubsub.topic.mockImplementation(() => mockTopic)
    })
    it('calls topic.get on pubsub', async () => {
      await topic('fake.topic' as any).publish({})

      expect(pubsub.topic).toHaveBeenCalledWith('fake.topic')
      expect(mockTopic.get).toHaveBeenCalledWith({ autoCreate: true })
    })
    describe('publish', () => {
      beforeEach(() => {
        mockTopic.publishMessage.mockImplementation(async () => 'ok')
      })
      it('calls publishMessage', async () => {
        await topic(topicName).publish(topicData)

        expect(mockTopic.publishMessage).toHaveBeenCalledTimes(1)
      })
      it('serialises the message', async () => {
        const identity = 'identity'
        const data = Buffer.from(
          JSON.stringify({ message: topicData, identity })
        )
        await topic(topicName).publish(topicData, identity)

        expect(mockTopic.publishMessage).toHaveBeenCalledWith({ data })
      })
      it('returns the result', async () => {
        const result = await topic(topicName).publish(topicData)

        expect(result).toEqual('ok')
      })
    })
    describe('subscribe', () => {
      let subscription: jest.MockedObject<Subscription>
      beforeEach(() => {
        const partialSubscription: Partial<Subscription> = {
          get: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
        }
        subscription = partialSubscription as jest.MockedObject<Subscription>
        subscription.get.mockImplementation(async () => [subscription])
        mockTopic.createSubscription.mockImplementation(async () => [
          subscription,
        ])
        mockTopic.subscription.mockImplementation(() => subscription)
      })

      describe('push delivery mode', () => {
        beforeEach(() => {
          process.env.PUBSUB_DELIVERY_MODE = 'push'
          process.env.PUBSUB_PUSH_HOST = 'http://localhost:8080'
        })
        afterEach(() => {
          delete process.env.PUBSUB_DELIVERY_MODE
          delete process.env.PUBSUB_PUSH_HOST
        })
        it('creates a subscription using topic.createSubscription', async () => {
          await topic(topicName).subscribe({
            subscriberName: 'gateway',
            onSuccess: () => undefined,
          })

          expect(mockTopic.createSubscription).toHaveBeenCalledWith(
            topicName + '.gateway',
            {
              pushConfig: expect.any(Object),
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
          mockTopic.createSubscription.mockRejectedValue(
            new Error('6 ALREADY_EXISTS: Subscription already exists') as never
          )

          await topic(topicName).subscribe({
            subscriberName: 'gateway',
            onSuccess: () => undefined,
          })

          expect(mockTopic.subscription).toHaveBeenCalledWith(
            topicName + '.gateway'
          )
          expect(subscription.get).toHaveBeenCalledWith()
        })
        it('subscribes', async () => {
          await topic(topicName).subscribe({
            subscriberName: 'gateway',
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
          const unsubscribe = await topic(topicName).subscribe({
            subscriberName: 'gateway',
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
          let subscriberFn
          let ack
          let nack

          beforeEach(() => {
            ack = jest.fn()
            nack = jest.fn()

            subscription.on.mockImplementation(
              (name: string, cb: (args: any[]) => void) => {
                if (name === 'push-message') subscriberFn = cb
                return subscription
              }
            )
          })
          it('acks after completed', async () => {
            const testTopic = topic(topicName)

            await testTopic.subscribe({
              subscriberName: 'gateway',
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
            const testTopic = topic(topicName)

            await testTopic.subscribe({
              subscriberName: 'gateway',
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
            const testTopic = topic(topicName)

            await testTopic.subscribe({
              subscriberName: 'gateway',
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

          it('acks when throw (promise)', async () => {
            const testTopic = topic(topicName)

            await testTopic.subscribe({
              subscriberName: 'gateway',
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
          delete process.env.PUBSUB_DELIVERY_MODE
          delete process.env.PUBSUB_PUSH_HOST
        })
        it('creates a subscription using topic.createSubscription', async () => {
          await topic(topicName).subscribe({
            subscriberName: 'gateway',
            onSuccess: () => undefined,
          })

          expect(mockTopic.createSubscription).toHaveBeenCalledWith(
            topicName + '.gateway',
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
          mockTopic.createSubscription.mockRejectedValue(
            new Error('6 ALREADY_EXISTS: Subscription already exists') as never
          )

          await topic(topicName).subscribe({
            subscriberName: 'gateway',
            onSuccess: () => undefined,
          })

          expect(mockTopic.subscription).toHaveBeenCalledWith(
            topicName + '.gateway'
          )
          expect(subscription.get).toHaveBeenCalledWith()
        })
        it('subscribes', async () => {
          await topic(topicName).subscribe({
            subscriberName: 'gateway',
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
          const unsubscribe = await topic(topicName).subscribe({
            subscriberName: 'gateway',
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
          let subscriberFn
          let ack
          let nack

          beforeEach(() => {
            ack = jest.fn()
            nack = jest.fn()

            subscription.on.mockImplementation(
              (name: string, cb: (args: any[]) => void) => {
                if (name === 'message') subscriberFn = cb
                return subscription
              }
            )
          })
          it('acks after completed', async () => {
            const testTopic = topic(topicName)

            await testTopic.subscribe({
              subscriberName: 'gateway',
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
            const testTopic = topic(topicName)

            await testTopic.subscribe({
              subscriberName: 'gateway',
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
            const testTopic = topic(topicName)

            await testTopic.subscribe({
              subscriberName: 'gateway',
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

          it('acks when throw (promise)', async () => {
            const testTopic = topic(topicName)

            await testTopic.subscribe({
              subscriberName: 'gateway',
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
  })
})
