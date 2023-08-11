import { ClientConfig } from './client'
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
    raw?: boolean,
  ) => Promise<string>
  subscribe: Subscriber<Msg>
  name: keyof Topics
}

export const createPubsub = <
  Topics extends TypeMap,
  SubscriberName extends string,
>() => {
  type TopicName = keyof Topics

  const topic = (
    name: TopicName,
    config?: ClientConfig,
  ): PubSubTopic<Topics[TopicName], Topics> => {
    return {
      publish: publisher<Topics[TopicName], TopicName, Record<string, unknown>>(
        name,
        config,
      ),
      subscribe: subscriber<Topics[TopicName], TopicName>(name, config),
      name: name,
    }
  }

  const subscribeToMultipleAs = (
    name: SubscriberName,
    config?: ClientConfig,
  ) => {
    const promises: Promise<Unsubscriber>[] = []
    const obj = {
      wait: async () => await Promise.all(promises),
      subscribe: <T extends TopicName>(
        topicName: T,
        { onSuccess, onError }: SubscriberHandler<Topics[TopicName]>,
      ) => {
        promises.push(
          topic(topicName.toString(), config).subscribe({
            subscriberName: name,
            onSuccess,
            onError,
          }),
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
