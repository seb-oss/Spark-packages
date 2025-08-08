import {
  type ClientConfig,
  Encodings,
  type ISchema,
  PubSub,
  SchemaTypes,
  type Topic,
} from '@google-cloud/pubsub'
import type {
  MessageOptions,
  PublishOptions,
} from '@google-cloud/pubsub/build/src/topic'
import { Type } from 'avsc'
import type { CloudSchema } from './shared'

const schemaIdPattern = /^(?!goog)[a-zA-Z][a-zA-Z0-9-._~%+]{2,254}$/

const syncTopicSchema = async (client: PubSub, cloudSchema: CloudSchema) => {
  if (!schemaIdPattern.test(cloudSchema.schemaId)) {
    throw Error(
      'schemaId is no in a valid format. Check google cloud platform for more information'
    )
  }

  const schema = client.schema(cloudSchema.schemaId)

  const exits = await schemaExists(client, cloudSchema.schemaId)
  if (exits) {
    const data = await schema.get()
    return data
  }

  await client.createSchema(
    cloudSchema.schemaId,
    SchemaTypes.Avro,
    cloudSchema.avroDefinition
  )
  const data = await schema.get()
  return data
}

const createOrGetTopic = async (
  client: PubSub,
  name: string,
  schemaData?: ISchema
) => {
  const [exists] = await client.topic(name).exists()
  if (exists) {
    const [topic] = await client.topic(name).get()
    return topic
  }

  if (schemaData) {
    const [topic] = await client.createTopic({
      name: name,
      schemaSettings: {
        schema: schemaData?.name,
        encoding: Encodings.Binary,
      },
    })
    return topic
  }

  const [topic] = await client.createTopic({
    name: name,
  })
  return topic
}

export type PublisherClient<T extends Record<string, unknown>> = {
  topic<K extends keyof T>(
    name: K,
    cloudSchema?: CloudSchema
  ): {
    publish<M extends T[K]>(message: M): Promise<void>
    initiate(): Promise<{ topic: Topic; type: Type | undefined }>
  }
}

export const createPublisher = <T extends Record<string, unknown>>(
  clientOptions?: ClientConfig | undefined,
  publishOptions?: PublishOptions | undefined
): PublisherClient<T> => {
  const client = clientOptions ? new PubSub(clientOptions) : new PubSub()
  const topics = new Map<string | number | symbol, Topic>()
  const types = new Map<string | number | symbol, Type>()

  const ensureInitiated = async (
    name: string | number | symbol,
    schema: CloudSchema | undefined
  ) => {
    if (topics.has(name)) {
      const topic = topics.get(name) as Topic
      const type = types.get(name)

      return { topic, type }
    }

    // Get or create topic
    let topic: Topic
    let type = types.get(name)

    if (schema) {
      const schemaData = await syncTopicSchema(client, schema)
      topic = await createOrGetTopic(client, name as string, schemaData)
    } else {
      topic = await createOrGetTopic(client, name as string)
    }

    topics.set(name, topic)

    // Set publish options
    if (publishOptions) {
      topic.setPublishOptions(publishOptions)
    }

    if (schema && !type) {
      const schemaType = Type.forSchema(JSON.parse(schema.avroDefinition))
      types.set(name, schemaType)
      type = schemaType
    }

    return { topic, type }
  }

  const typedClient: PublisherClient<T> = {
    topic: (name, schema) => {
      return {
        initiate: async () => {
          return ensureInitiated(name, schema)
        },
        publish: async (json) => {
          const { topic, type } = await ensureInitiated(name, schema)

          if (type) {
            // Pubsub requires a Buffer but the typing forbids a Buffer 🤯
            const data = type.toBuffer(
              json
            ) as unknown as MessageOptions['data']
            await topic.publishMessage({ data })
          } else {
            await topic.publishMessage({ json })
          }
        },
      }
    },
  }
  return typedClient
}

const schemaExists = async (client: PubSub, schemaId: string) => {
  for await (const s of client.listSchemas()) {
    if (s.name?.endsWith(`/${schemaId}`)) {
      return true
    }
  }
  return false
}
