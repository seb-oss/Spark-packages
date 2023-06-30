import { publisher } from './publisher'
import type { Subscriber, SubscriberHandler, Unsubscriber } from './subscriber'
import { subscriber } from './subscriber'

export interface TypeMap {
  [event: string]: unknown
}

export interface PubSubTopic<Msg, Topics extends TypeMap> {
  publish: (message: Msg, headers?: Record<string, unknown>) => Promise<string>
  subscribe: Subscriber<Msg>
  name: keyof Topics
}

export const createPubsub = <
  Topics extends TypeMap,
  SubscriberName extends string
>() => {
  type TopicName = keyof Topics

  const topic = (name: TopicName): PubSubTopic<Topics[TopicName], Topics> => {
    return {
      publish: publisher<Topics[TopicName], TopicName, Record<string, unknown>>(
        name
      ),
      subscribe: subscriber<Topics[TopicName], TopicName>(name),
      name: name,
    }
  }

  const subscribeToMultipleAs = (name: SubscriberName) => {
    const promises: Promise<Unsubscriber>[] = []
    const obj = {
      wait: async () => await Promise.all(promises),
      subscribe: <T extends TopicName>(
        topicName: T,
        { onSuccess, onError }: SubscriberHandler<Topics[TopicName]>
      ) => {
        promises.push(
          topic(topicName.toString()).subscribe({
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
