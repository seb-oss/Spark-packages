import type { Topic } from '@google-cloud/pubsub'
import { PubSub } from '@google-cloud/pubsub'

export const pubsub = new PubSub()

export const getOrCreateTopic = async (
  topicName: string,
  tries = 0
): Promise<Topic> => {
  try {
    const [t] = await pubsub.topic(topicName).get({ autoCreate: true })
    return t
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code && err?.code === 6 && tries < 3) {
      return getOrCreateTopic(topicName, tries + 1)
    } else {
      throw err
    }
  }
}
