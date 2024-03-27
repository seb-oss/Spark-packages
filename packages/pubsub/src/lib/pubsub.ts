import type { ClientConfig } from './client'
import { publisher } from './publisher'
import type { Subscriber, SubscriberHandler, Unsubscriber } from './subscriber'
import { subscriber } from './subscriber'

export interface TypeMap {
  [event: string]: unknown
}

export interface PubSubTopic<Msg, Topics extends TypeMap> {
  publish: (
    message: Msg,
    headers?: Record<string, unknown>,
    raw?: boolean
  ) => Promise<string>
  subscribe: Subscriber<Msg>
  name: keyof Topics
}

export const createPubsub = <
  Topics extends TypeMap,
  SubscriberName extends string,
>() => {
  type TopicName = keyof Topics

  const topic = <T extends TopicName>(
    name: T,
    config?: ClientConfig
  ): PubSubTopic<Topics[T], Topics> => {
    return {
      publish: publisher<Topics[T], T, Record<string, unknown>>(name, config),
      subscribe: subscriber<Topics[T], T>(name, config),
      name: name,
    }
  }

  const subscribeToMultipleAs = (
    name: SubscriberName,
    config?: ClientConfig
  ) => {
    const promises: Promise<Unsubscriber>[] = []
    const obj = {
      wait: async () => await Promise.all(promises),
      subscribe: <T extends TopicName>(
        topicName: T,
        { onSuccess, onError }: SubscriberHandler<Topics[TopicName]>
      ) => {
        promises.push(
          topic(topicName.toString(), config).subscribe({
            subscriberName: name,
            onSuccess,
            onError,
          })
        )
        return obj
      },
    }
    return obj
  }

  return {
    topic,
    subscribeToMultipleAs,
  }
}
