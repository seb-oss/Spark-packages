import { ClientConfig, getOrCreateTopic } from './client'

interface Publisher<T, Headers, raw> {
  (message: T, headers?: Headers, rawMessage?: raw): Promise<string>
}

interface PubsubMessage<Message, Headers extends Record<string, unknown>> {
  message: Message
  headers?: Headers
}

export const publisher =
  <
    Msg,
    TopicName extends string | number | symbol,
    Headers extends Record<string, unknown>,
  >(
    topicName: TopicName,
    config?: ClientConfig
  ): Publisher<Msg, Headers, boolean> =>
  async (message, headers?, raw?) => {
    const topic = await getOrCreateTopic(topicName.toString(), config)
    const msg: PubsubMessage<Msg, Headers> = {
      message,
      headers,
    }

    let data
    if (raw) {
      // Only send the message as the message.
      data = Buffer.from(JSON.stringify(message))
    } else {
      data = Buffer.from(JSON.stringify(msg))
    }

    return topic.publishMessage({ data })
  }
