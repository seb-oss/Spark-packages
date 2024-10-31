import {
  type ClientConfig,
  type CreateSubscriptionOptions,
  type Message,
  PubSub,
  type Subscription,
  type Topic,
} from '@google-cloud/pubsub'

const createOrGetSubscription = async (
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
    return topic.subscription(name)
  }

  const [subscription] = await topic.createSubscription(
    name,
    createSubscriptionOptions
  )
  return subscription
}

export type TypedMessage<T> = Omit<Message, 'data'> & {
  data: T
}

export type SubscriptionClient<T extends Record<string, unknown>> = {
  topic<K extends keyof T>(
    name: K
  ): {
    subscribe<M extends T[K]>(
      name: string,
      callbacks: {
        onMessage: (message: TypedMessage<M>) => Promise<void>
        onError?: (message: TypedMessage<M>, error: unknown) => Promise<void>
      },
      options?: PubSubOptions
    ): Promise<Subscription>
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

  const typedClient: SubscriptionClient<T> = {
    topic: (name) => {
      let _topic: Topic

      return {
        subscribe: async (
          subscriptionName,
          callbacks,
          options?: PubSubOptions
        ) => {
          if (!_topic) {
            _topic = client.topic(name as string)
          }
          const fullName = `${name as string}_${subscriptionName}`

          const subscription = await createOrGetSubscription(
            _topic,
            fullName,
            options
          )

          subscription.on('message', async (msg) => {
            const data = JSON.parse(msg.data.toString('utf8'))
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
      }
    },
  }
  return typedClient
}
