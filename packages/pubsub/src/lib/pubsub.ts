import { publisher } from './publisher'
import {
  Subscriber,
  subscriber,
  SubscriberHandler,
  Unsubscriber,
} from './subscriber'

export interface TypeMap {
  [event: string]: unknown
}

export interface PubSubTopic<Msg, Topics extends TypeMap> {
  publish: (message: Msg, identity?: string) => Promise<string>
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
      publish: publisher<Topics[TopicName], TopicName, null>(name),
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
        { onSuccess, onError }: SubscriberHandler<Topics[T]>
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
