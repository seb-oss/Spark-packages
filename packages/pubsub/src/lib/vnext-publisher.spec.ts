import { type Mock, type MockedObject, describe, expect, it, vi } from 'vitest'
import { PubSub, Schema, SchemaTypes, type Topic } from '@google-cloud/pubsub'
//import { createPublisher, createSubscriber } from './vnext'
import { z } from 'zod'
import { zodToAvro } from './zod-to-avro'
import { createPublisher } from './vnext-publisher'
import { Type } from 'avsc'

const exampleSchema = z.object({
  messageType: z.string(),
  created: z.string(),
  data: z.string().optional(),
})

type ExampleMessage = z.infer<typeof exampleSchema>
const exampleAvroSchema = zodToAvro('Example', exampleSchema, {
  namespace: 'com.acme.example',
})

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
      get: vi.fn().mockImplementation(() => ([topics[name]])),
      getMetadata: vi.fn().mockImplementation(() => ([{schemaSettings:{}}])),
      setMetadata: vi.fn()
    } as unknown as Topic
    return topics[name]
  })

  const currentSchema = {
      get: vi.fn().mockImplementation(() => ({revisionId: 'a-revision-id'}))
    }

  const schema = vi.fn().mockImplementation(() => {
    return currentSchema;
  })

  const pubsub: Partial<PubSub> = {
    topic: mockTopic,
    createSchema: vi.fn().mockImplementation(() => ({id: 'first-revision-id'})),
    schema: vi.fn().mockImplementation((name) => schema(name) as unknown as Schema)
  }

  return {
    PubSub: vi.fn().mockReturnValue(pubsub),
    SchemaTypes: {
        ProtocolBuffer: "PROTOCOL_BUFFER",
        Avro: "AVRO"
    }
  }
})

let subscriberFn: (args: { ack: Mock; nack: Mock; data: string }) => void

const description = 'This is an example message'
const zodValue = z.object(
  {
    messageType: z.string(),
    message: z.number(),
  },
  { description }
)
const avroSchema = zodToAvro('ExampleMessage', zodValue)

// When client is set up with project id. PUBSUB is beeing called with the correct things.
// When topic publish is run, we can se that correct data is beeing sent to the underlying things.
// check that _topic.publishMessage({ json: message }) has been called.

// When subsribe we can trigger the call back that is beeing registered.

/*
  things to test.
  - Initiation is run with the correct parrams.
  - If not schema
    - Check if publish JSON is run on the instance
  - If schema
    - Schema sync is run with the right params
    - Using publish instread of publish JSON
    - Check if schema validation is working or not when publishing
  


*/

describe('when creating a new pubsub client the internal client', () => {
  it('should be initiated with the configuration', async () => {

    const topicMock = new PubSub().topic('example') as MockedObject<Topic>
    const pubSubMock = new PubSub() as MockedObject<PubSub>

    const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })

    const message = { messageType: 'TYPE', created: new Date().toISOString() }
    await client
      .topic('example')
      .publish(message)

    expect(pubSubMock.topic).toBeCalledWith("example")
    expect(topicMock.get).toBeCalledWith({autoCreate: true})
    expect(topicMock.publishMessage).toBeCalledWith({ json: message});
  })
})

describe('when creating a new pubsub client the internal client with a schema that exists', () => {
  it('should be initiated with the configuration', async () => {
    const topicMock = new PubSub().topic('example') as MockedObject<Topic>
    const pubSubMock = new PubSub() as MockedObject<PubSub>
    const schemaMock = new PubSub().schema("schemaId") as MockedObject<Schema>

    const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })

    const message = { messageType: 'TYPE', created: new Date().toISOString() }
    await client
      .topic('example', {schemaId: 'schemaId', avroDefinition: JSON.stringify(exampleAvroSchema) })
      .publish(message)
      const schemaType = Type.forSchema(exampleAvroSchema)

    expect(pubSubMock.topic).toBeCalledWith("example")
    expect(pubSubMock.schema).toBeCalled();
    expect(schemaMock.get).toBeCalled();
    expect(topicMock.get).toBeCalledWith({autoCreate: true})
    expect(topicMock.publishMessage).toBeCalledWith({ data: schemaType.toBuffer(message)});
  })
})

describe('when creating a new pubsub client the internal client with a schema that does not exsist', () => {
  it('should be initiated with the configuration', async () => {
    const topicMock = new PubSub().topic('example') as MockedObject<Topic>
    const pubSubMock = new PubSub() as MockedObject<PubSub>
    const schemaMock = new PubSub().schema("schemaId") as MockedObject<Schema>

    schemaMock.get.mockImplementationOnce(() => {
      throw new Error('SCHEMA DOES NOT EXIST')
    })

    const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })

    const message = { messageType: 'TYPE', created: new Date().toISOString() }
    await client
      .topic('example', {schemaId: 'schemaId', avroDefinition: JSON.stringify(exampleAvroSchema) })
      .publish(message)
      const schemaType = Type.forSchema(exampleAvroSchema)

    expect(pubSubMock.topic).toBeCalledWith("example")
    expect(pubSubMock.schema).toBeCalled();
    expect(schemaMock.get).toBeCalled();
    expect(pubSubMock.createSchema).toBeCalledWith(
      "schemaId",
      SchemaTypes.Avro,
      JSON.stringify(exampleAvroSchema)
    );
    expect(topicMock.get).toBeCalledWith({autoCreate: true})
    expect(topicMock.publishMessage).toBeCalledWith({ data: schemaType.toBuffer(message)});
  })
})


/*
describe('when publishing on a topic the internal client is called with the correct values', () => {
    it('should be initiated with the configuration', async () => {
      const client = createSubscriber<ExamplePubsubChannels>({
        projectId: 'test',
      })
      client.topic("example").publish({messageType: "the type", data: "Data goes here."});
      
      expect(PubSub).toBeCalledWith({
        projectId: 'test',
      })
    })
  })
*/
