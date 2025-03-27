import {
  type ClientConfig,
  type CreateSubscriptionOptions,
  type Message,
  PubSub,
  type Subscription,
  type Topic,
} from '@google-cloud/pubsub'
import { Type } from 'avsc'
import type { CloudSchema } from './shared'

const makeSureSubscriptionExists = async (
  topic: Topic,
  name: string,
  options?: PubSubOptions
) => {
  const createSubscriptionOptions: CreateSubscriptionOptions = {
    messageRetentionDuration: {
      seconds: options?.messageRetentionDuration || 3600 * 24, // Default to 1 day.
    },
    expirationPolicy: {
      ttl: {
        seconds: options?.expirationPolicy || 3600 * 24 * 7, // Default to 7 days.
      },
    },
  }

  const [exists] = await topic.subscription(name).exists()

  if (exists) {
    return
  }

  await topic.createSubscription(name, createSubscriptionOptions)
}

export type TypedMessage<T> = Omit<Message, 'data'> & {
  data: T
}

export type SubscriptionClient<T extends Record<string, unknown>> = {
  topic<K extends keyof T>(
    name: K,
    cloudSchema?: CloudSchema
  ): {
    subscribe<M extends T[K]>(
      name: string,
      callbacks: {
        onMessage: (message: TypedMessage<M>) => Promise<void>
        onError?: (message: TypedMessage<M>, error: unknown) => Promise<void>
      },
      options?: PubSubOptions
    ): Promise<Subscription>
    initiate<M extends T[K]>(
      name: string,
      options?: PubSubOptions
    ): Promise<void>
    close: (name: string) => Promise<void>
    delete: (name: string) => Promise<void>
  }
}

export type PubSubOptions = {
  expirationPolicy: number
  messageRetentionDuration: number
  autoAck?: boolean
}

export const createSubscriber = <T extends Record<string, unknown>>(
  clientOptions?: ClientConfig | undefined
): SubscriptionClient<T> => {
  const client = clientOptions ? new PubSub(clientOptions) : new PubSub()
  let _type: Type

  const typedClient: SubscriptionClient<T> = {
    topic: (name, schema) => {
      if (schema && !_type) {
        const schemaType = Type.forSchema(JSON.parse(schema.avroDefinition))
        _type = schemaType
      }

      const _topic: Topic = client.topic(name as string)

      return {
        initiate: async (subscriptionName, options) => {
          await makeSureSubscriptionExists(_topic, subscriptionName, options)
        },
        subscribe: async (subscriptionName, callbacks, options) => {
          const subscription = _topic.subscription(subscriptionName)
          subscription.on('message', async (msg) => {
            const data = _type
              ? _type.fromBuffer(msg.data)
              : JSON.parse(msg.data.toString('utf8'))
            if (options?.autoAck === undefined || options.autoAck === true) {
              try {
                await callbacks.onMessage(Object.assign(msg, { data }))
                msg.ack()
              } catch (error) {
                msg.nack()
                callbacks.onError
                  ? callbacks.onError(Object.assign(msg, { data }), error)
                  : console.error(error)
              }
            } else {
              await callbacks.onMessage(Object.assign(msg, { data }))
            }
          })

          return subscription
        },
        close: async (subscriptionName: string) => {
          const subscription = _topic.subscription(subscriptionName)
          await subscription.close()
        },
        delete: async (subscriptionName: string) => {
          const subscription = _topic.subscription(subscriptionName)
          await subscription.delete()
        },
      }
    },
  }
  return typedClient
}
