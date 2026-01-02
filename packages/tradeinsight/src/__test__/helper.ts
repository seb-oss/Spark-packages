import type { PubSub, Topic } from '@google-cloud/pubsub'

export const ensureTopic = async (
  pubsub: PubSub,
  topicName: string
): Promise<Topic> => {
  // Ensure topic
  const topic = pubsub.topic(topicName, {})
  const [topicExists] = await topic.exists()
  if (!topicExists) {
    await pubsub.createTopic({
      name: topicName,
    })
  }

  return topic
}
