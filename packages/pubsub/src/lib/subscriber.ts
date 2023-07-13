import type {
  CreateSubscriptionOptions,
  Message,
  Subscription,
  Topic,
} from '@google-cloud/pubsub'
import { getOrCreateTopic } from './client'

const ALREADY_EXISTS_ERROR = '6 ALREADY_EXISTS'

export type AuthenticatedUser = {
  token?: string
}

export type PubSubHeaders = {
  authenticatedUser?: AuthenticatedUser
  correlationId?: string
  traceparent?: string
}

export type TypedMessage<T> = Message & {
  body: T
  headers: PubSubHeaders
}

type SubscriberArgs<T> = {
  subscriberName: string
} & SubscriberHandler<T>

export type SubscriberHandler<T> = {
  onError?: (err: Error) => void | Promise<void>
  onSuccess: (msg: T, headers: PubSubHeaders) => void | Promise<void>
  options?: CreateSubscriptionOptions
}

export interface Unsubscriber {
  (): void
}

export interface Subscriber<T> {
  (args: SubscriberArgs<T>): Promise<Unsubscriber>
}

interface PubsubMessage<T> {
  message: T
  identity?: string
}

export const subscriptions: Record<string, Subscription> = {}

const subscriptionDefaultConfig =
  async (): Promise<CreateSubscriptionOptions> => {
    const deadLetterTopicName =
      process.env.PUBSUB_DEAD_LETTER_TOPIC || 'dead.letter.topic'
    const maxDeliveryAttempts = parseInt(
      process.env.PUBSUB_MAX_DELIVERY_ATTEMPTS || '20',
      10
    )
    const deadLetterTopic = (await getOrCreateTopic(deadLetterTopicName)).name

    const subscriptionOptions: CreateSubscriptionOptions = {
      deadLetterPolicy: {
        deadLetterTopic,
        maxDeliveryAttempts,
      },
      retryPolicy: {
        minimumBackoff: { seconds: 10 },
        maximumBackoff: { seconds: 600 },
      },
    }
    return subscriptionOptions
  }

const subscriptionPullConfig = (): Promise<CreateSubscriptionOptions> => {
  return subscriptionDefaultConfig()
}

const subscriptionPushConfig = async (): Promise<CreateSubscriptionOptions> => {
  if (!process.env.PUBSUB_PUSH_HOST) {
    throw new Error(
      'Environment variable PUBSUB_PUSH_HOST is missing and cannot set a push endpoint'
    )
  }

  if (!process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL) {
    // eslint-disable-next-line no-console
    console.warn(
      'Environment variable PUBSUB_SERVICE_ACCOUNT_EMAIL should be set if running in GCP'
    )
  }

  const subscriptionOptions = await subscriptionDefaultConfig()
  const pushEndpoint = `${process.env.PUBSUB_PUSH_HOST}/pubsub/push`
  const serviceAccountEmail = process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL

  subscriptionOptions.pushConfig = {
    pushEndpoint,
  }

  if (serviceAccountEmail) {
    subscriptionOptions.pushConfig.oidcToken = {
      serviceAccountEmail,
    }
  }

  return subscriptionOptions
}

const getCreateSubscriptionOptions =
  async (): Promise<CreateSubscriptionOptions> => {
    switch (process.env.PUBSUB_DELIVERY_MODE) {
      case 'push':
        return subscriptionPushConfig()
      case 'pull':
        return subscriptionPullConfig()
      default:
        throw new Error(
          'Environment variable PUBSUB_DELIVERY_MODE must be set to either push or pull'
        )
    }
  }

// eslint-disable-next-line max-statements
const createOrGetSubscription = async (
  subscriptionName: string,
  topic: Topic
): Promise<Subscription> => {
  let subscription: Subscription

  try {
    ;[subscription] = await topic.createSubscription(
      subscriptionName,
      await getCreateSubscriptionOptions()
    )
  } catch (ex) {
    if (ex instanceof Error && !ex.message.startsWith(ALREADY_EXISTS_ERROR)) {
      throw ex
    }
    ;[subscription] = await topic.subscription(subscriptionName).get()
  }

  subscriptions[subscription.name] = subscription
  return subscription
}

export const subscriber =
  <Msg, TopicName extends string | number | symbol>(
    topicName: TopicName
  ): Subscriber<Msg> =>
  async ({ subscriberName, onSuccess, onError }) => {
    const topic = await getOrCreateTopic(topicName.toString())
    const subscriptionName = `${topicName.toString()}.${subscriberName}`
    const subscription = await createOrGetSubscription(subscriptionName, topic)
    const messageHandler = async (message: Message) => {
      const data: PubsubMessage<Msg> = JSON.parse(message.data.toString())

      const typed = {
        ...message,
        body: data.message,
        headers: {
          authenticatedUser: {
            token: data.identity,
          },
        },
      }

      try {
        await onSuccess(typed.body, typed.headers)
        message.ack()
      } catch (err) {
        message.nack()
        // eslint-disable-next-line no-console
        console.error(err)
      }
    }

    const errorHandler = async (err: Error) => {
      if (onError) await onError(err)
    }

    let messageHandlerEvent: string

    switch (process.env.PUBSUB_DELIVERY_MODE) {
      case 'push':
        messageHandlerEvent = 'push-message'
        break
      case 'pull':
        messageHandlerEvent = 'message'
        break
      default:
        throw new Error(
          'Environment variable PUBSUB_DELIVERY_MODE must be set to either push or pull'
        )
    }

    subscription.on(messageHandlerEvent, messageHandler)
    subscription.on('error', errorHandler)

    const unsubscriber: Unsubscriber = () => {
      subscription.off(messageHandlerEvent, messageHandler)
      subscription.off('error', errorHandler)
    }

    return unsubscriber
  }
