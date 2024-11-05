import {
  type ClientConfig,
  Encodings,
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

  const [topic] = await client.createTopic({
    name: name,
    schemaSettings: {
      schema: schemaData?.name,
      encoding: Encodings.Json,
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
            const data = Buffer.from(_type.toString(json))
            await _topic.publishMessage({ data })
          } else {
            await _topic.publishMessage({ json })
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
