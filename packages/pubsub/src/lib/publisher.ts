import { getOrCreateTopic } from './client'

interface Publisher<T, Headers> {
  (message: T, headers?: Headers): Promise<string>
}

interface PubsubMessage<T, H extends Record<string, unknown>> {
  message: T
  headers: H
}

export const publisher =
  <
    Msg,
    TopicName extends string | number | symbol,
    Headers extends Record<string, unknown>
  >(
    topicName: TopicName
  ): Publisher<Msg, Headers> =>
  async (message, headers?) => {
    const topic = await getOrCreateTopic(topicName.toString())
    const msg: PubsubMessage<Msg, Headers> = {
      message,
      headers,
    }
    const data = Buffer.from(JSON.stringify(msg))

    return topic.publishMessage({ data })
  }
