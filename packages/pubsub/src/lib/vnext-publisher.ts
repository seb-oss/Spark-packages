import {
  type ClientConfig,
  type ISchema,
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
  const schema = await client.schema(cloudSchema.schemaId)
  try {
    const data = await schema.get()
    return data
  } catch (err) {
    await client.createSchema(
      cloudSchema.schemaId,
      SchemaTypes.Avro,
      cloudSchema.avroDefinition
    )
    const data = await schema.get()
    return data
  }
}

const createOrGetTopic = async (
  client: PubSub,
  name: string,
  schemaData?: ISchema
) => {
  const [topic] = await client.topic(name).get({ autoCreate: true })

  if (!schemaData) {
    return topic
  }

  const [topicMetadata] = await topic.getMetadata()
  const topicSchemaMetadata = topicMetadata.schemaSettings
  
  await topic.setMetadata({
    ...topicMetadata,
    schemaSettings: {
      encoding: "JSON",
      firstRevisionId: topicSchemaMetadata?.firstRevisionId ?? schemaData.revisionId,
      lastRevisionId: schemaData.revisionId,
      schema: schemaData.name,
    },
  })
  
  return topic
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
        const schemaData = await syncTopicSchema(client, schema)
        _topic = await createOrGetTopic(client, name as string, schemaData)
      }

      _topic = await createOrGetTopic(client, name as string)
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
          return ensureInitiated(name, schema)
        },
        publish: async (json) => {
          await ensureInitiated(name, schema)

          if (_type) {
            const data = _type.toBuffer(json)
            await _topic.publishMessage({ data })
          } else {
            await _topic.publishMessage({ json })
          }
        },
      }
    },
  }

  console.log('typedClient', typedClient)
  return typedClient
}
