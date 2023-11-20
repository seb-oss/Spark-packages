import type { Topic } from '@google-cloud/pubsub'
import { PubSub } from '@google-cloud/pubsub'

export type ClientConfig = {
  projectId: string

  credentials?: {
    client_email: string
    private_key: string
  }
}

const localProjectId = 'local'
const clients: Record<string, PubSub> = {}

const init = (
  { projectId, credentials }: ClientConfig = { projectId: localProjectId }
) => {
  if (!clients[projectId]) {
    if (projectId === localProjectId) {
      // Create a default client when there is no config.
      clients[projectId] = new PubSub()
    } else {
      clients[projectId] = new PubSub({
        projectId,
        credentials,
      })
    }
  }
}

export const getOrCreateTopic = async (
  topicName: string,
  config?: ClientConfig,
  tries = 0
): Promise<Topic> => {
  // Ensure there is always a client for desired project, as specified in config.
  init(config)

  try {
    const [t] = await clients[config?.projectId || localProjectId]
      .topic(topicName)
      .get({ autoCreate: true })
    return t
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code && err?.code === 6 && tries < 3) {
      return getOrCreateTopic(topicName, config, tries + 1)
    } else {
      throw err
    }
  }
}
