import {
  type ClientConfig,
  PubSub,
  SchemaTypes,
  type Topic,
} from '@google-cloud/pubsub'

import { Type } from 'avsc'

const schemaIdPattern = /^(?!goog)[a-zA-Z][a-zA-Z0-9-._~%+]{2,254}$/

type CloudSchema = {
  schemaId: string
  avroDefinition: string
}

const syncTopicSchema = async (client: PubSub, cloudSchema: CloudSchema) => {
  if (!schemaIdPattern.test(cloudSchema.schemaId)) {
    throw Error(
      'schemaId is no in a valid format. Check google cloud platform for more information'
    )
  }

  try {
    const schema = await client.schema(cloudSchema.schemaId)
    const info = await schema.get()
    return info.revisionId
  } catch (err) {
    const info = await client.createSchema(
      cloudSchema.schemaId,
      SchemaTypes.Avro,
      cloudSchema.avroDefinition
    )
    return info.id
  }
}

const createOrGetTopic = async (
  client: PubSub,
  name: string,
  schemaRevisionId?: string
) => {
  try {

    if (!schemaRevisionId) {
      try {
        const [topic] = await client.createTopic(name)
        return topic
      } catch (err) {
        return client.topic(name)
      }
    }
    const topic = client.topic(name)
    const [topicMetadata] = await topic.getMetadata()
    const topicSchemaMetadata = topicMetadata.schemaSettings
    const currentRevisionId =
      topicSchemaMetadata?.lastRevisionId ??
      topicSchemaMetadata?.firstRevisionId
    if (!currentRevisionId || currentRevisionId !== schemaRevisionId) {
      await topic.setMetadata({
        ...topicMetadata,
        schemaSettings: {
          firstRevisionId:
            topicSchemaMetadata?.firstRevisionId ?? schemaRevisionId,
          lastRevisionId: schemaRevisionId,
        },
      })
    }
    return topic
  } catch (err) {
    const [topic] = await client.createTopic({
      name,
      schemaSettings: schemaRevisionId
        ? {
            schema: schemaRevisionId,
            encoding: 'JSON',
          }
        : undefined,
    })
    return topic
  }
}

export type PublisherClient<T extends Record<string, unknown>> = {
  topic<K extends keyof T>(
    name: K,
    cloudSchema?: CloudSchema
  ): {
    publish<M extends T[K]>(message: M): Promise<void>
    initiate(): Promise<void>
  }
}

export const createPublisher = <T extends Record<string, unknown>>(
  clientOptions?: ClientConfig | undefined
): PublisherClient<T> => {
  const client = clientOptions ? new PubSub(clientOptions) : new PubSub()
  console.log('client', client)
  let _topic: Topic
  let _type: Type
  const ensureInitiated = async (
    name: string | number | symbol,
    schema: CloudSchema | undefined
  ) => {
    if (!_topic) {
      if (schema) {
        const currentSchemaRevisionId = await syncTopicSchema(client, schema)
        _topic = await createOrGetTopic(
          client,
          name as string,
          currentSchemaRevisionId ?? undefined
        )
      }
      console.log(client, name)
      _topic = await createOrGetTopic(client, name as string)
      console.log('topic', _topic)
    }
    if (schema && !_type) {
      const schemaType = Type.forSchema(JSON.parse(schema.avroDefinition))
      _type = schemaType
    }
  }
  const typedClient: PublisherClient<T> = {
    topic: (name, schema) => {
      return {
        initiate: async () => {
          console.log('meow')
          return ensureInitiated(name, schema)
        },
        publish: async (message) => {
          await ensureInitiated(name, schema)

          console.log('hej', _type)

          if (_type) {
            const dataBuffer = _type.toBuffer(message)
            await _topic.publish(dataBuffer)
          } else {
            await _topic.publishMessage({ json: message })
          }
        },
      }
    },
  }

  console.log('typedClient', typedClient)
  return typedClient
}
