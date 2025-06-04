import {
  PubSub,
  type Schema,
  SchemaTypes,
  type Topic,
} from '@google-cloud/pubsub'
import { type MockedObject, describe, expect, it, vi } from 'vitest'
import { createPublisher } from './publisher'

type ExampleMessage = {
  messageType: string
  message: string
}

const exampleAvroSchema = `
{
  "type": "record",
  "name": "ExampleMessage",
  "namespace": "com.example",
  "fields": [
    {
      "name": "messageType",
      "type": "string"
    },
    {
      "name": "message",
      "type": "string"
    }
  ]
}
`

const message = {
  messageType: 'type of message',
  message: 'message data',
} satisfies ExampleMessage

type ExamplePubsubChannels = {
  example: ExampleMessage
}

vi.mock('@google-cloud/pubsub', () => {
  const topics: { [key: string]: Topic } = {}
  const mockTopic = vi.fn().mockImplementation((name: string) => {
    if (topics[name]) {
      return topics[name]
    }
    topics[name] = {
      name,
      publishMessage: vi.fn(),
      get: vi.fn().mockImplementation(() => [topics[name]]),
      getMetadata: vi.fn().mockImplementation(() => [{ schemaSettings: {} }]),
      setMetadata: vi.fn(),
      setPublishOptions: vi.fn(),
      exists: vi.fn().mockImplementation(() => [true]),
    } as unknown as Topic
    return topics[name]
  })

  const currentSchema = {
    get: vi.fn().mockImplementation(() => ({ revisionId: 'a-revision-id' })),
  }

  const schema = vi.fn().mockImplementation(() => {
    return currentSchema
  })

  const pubsub: Partial<PubSub> = {
    topic: mockTopic,
    listSchemas: vi.fn().mockImplementation(() => {
      return [{ name: 'schemaId' }]
    }),
    createTopic: mockTopic,
    createSchema: vi
      .fn()
      .mockImplementation(() => ({ id: 'first-revision-id' })),
    schema: vi
      .fn()
      .mockImplementation((name) => schema(name) as unknown as Schema),
  }

  return {
    PubSub: vi.fn().mockReturnValue(pubsub),
    SchemaTypes: {
      ProtocolBuffer: 'PROTOCOL_BUFFER',
      Avro: 'AVRO',
    },
  }
})

const description = 'This is an example message'

describe('when creating a new publisher client with no schema and publish a message', () => {
  it('should call the underlaying api with the correct values and message format', async () => {
    const topicMock = new PubSub().topic('example') as MockedObject<Topic>
    const pubSubMock = new PubSub() as MockedObject<PubSub>

    const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })

    await client.topic('example').publish(message)

    expect(topicMock.setPublishOptions).toBeCalledTimes(0)

    expect(pubSubMock.topic).toBeCalledWith('example')
    expect(topicMock.get).toBeCalledWith()
    expect(topicMock.publishMessage).toBeCalledWith({ json: message })
  })
  it('sets publish options', async () => {
    const topicMock = new PubSub().topic('example') as MockedObject<Topic>

    const client = createPublisher<ExamplePubsubChannels>(undefined, {
      batching: { maxMessages: 1 },
    })
    await client.topic('example').initiate()
    await client.topic('example').initiate()

    expect(topicMock.setPublishOptions).toBeCalledTimes(1)
    expect(topicMock.setPublishOptions).toBeCalledWith({
      batching: { maxMessages: 1 },
    })
  })
})

describe('when creating a new publisher client with schema that does not exist and publish a message', () => {
  it('should call the underlaying api with the correct values and message format', async () => {
    const topicMock = new PubSub().topic('example') as MockedObject<Topic>
    const pubSubMock = new PubSub() as MockedObject<PubSub>
    const schemaMock = new PubSub().schema('schemaId') as MockedObject<Schema>

    const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })

    await client
      .topic('example', {
        schemaId: 'schemaId',
        avroDefinition: exampleAvroSchema,
      })
      .publish(message)
    expect(pubSubMock.topic).toBeCalledWith('example')
    expect(pubSubMock.schema).toBeCalled()
    expect(schemaMock.get).toBeCalled()
    expect(topicMock.get).toBeCalledWith()
    expect(topicMock.publishMessage).toBeCalledWith({ json: message })
  })
})

describe('when creating a new publisher client with schema that does exist and publish a message', () => {
  it('should call the underlaying api with the correct values and message format', async () => {
    const topicMock = new PubSub().topic('example') as MockedObject<Topic>
    const pubSubMock = new PubSub() as MockedObject<PubSub>
    const schemaMock = new PubSub().schema('schemaId') as MockedObject<Schema>

    const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })

    await client
      .topic('example', {
        schemaId: 'schemaId-does-not-exist',
        avroDefinition: exampleAvroSchema,
      })
      .publish(message)
    expect(pubSubMock.topic).toBeCalledWith('example')
    expect(pubSubMock.schema).toBeCalled()
    expect(schemaMock.get).toBeCalled()
    expect(pubSubMock.createSchema).toBeCalledWith(
      'schemaId-does-not-exist',
      SchemaTypes.Avro,
      exampleAvroSchema
    )
    expect(topicMock.get).toBeCalledWith()
    expect(topicMock.publishMessage).toBeCalledWith({ json: message })
  })
})
