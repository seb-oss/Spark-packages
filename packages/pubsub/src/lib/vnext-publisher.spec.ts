import { type Mock, type MockedObject, describe, expect, it, vi } from 'vitest'
import { PubSub, type Topic } from '@google-cloud/pubsub'
//import { createPublisher, createSubscriber } from './vnext'
import { z } from 'zod'
import { zodToAvro } from './zod-to-avro'
import { createPublisher } from './vnext-publisher'
import { get } from 'node:http'

const exampleSchema = z.object({
  messageType: z.string(),
  created: z.date(),
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
      get: vi.fn().mockImplementation(() => ([topics[name]]))
    } as unknown as Topic
    return topics[name]
  })

  const schema = vi.fn().mockImplementation(() => {
    return {
      get: vi.fn().mockImplementation(() => ({revisionId: 'a-revision-id'}))
    }
  })

  const pubsub: Partial<PubSub> = {
    topic: mockTopic,
    createSchema: vi.fn().mockImplementation(() => ({id: 'first-revision-id'})),
    schema: vi.fn().mockImplementation(() => schema)
  }

  return {
    PubSub: vi.fn().mockReturnValue(pubsub),
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
    const randomNumber = Math.random()

    const topicMock = new PubSub().topic('example') as MockedObject<Topic>
    const pubSubMock = new PubSub() as MockedObject<PubSub>
    /*topicMock.publishMessage.mockImplementation((data) => {
      console.log(data)
    })*/
    console.log('topicMock', topicMock)

    const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })

    

    const message = { messageType: 'TYPE', created: new Date() }
    await client
      .topic('example')
      .publish(message)
    expect(topicMock.get).toBeCalledWith({autoCreate: true})
    expect(topicMock.publishMessage).toBeCalledWith({ json: message});
    /*expect(nuvarandeTopic.publish).toBeCalledWith({
      projectId: 'test',
    })*/

    //expect(mockTopic).toBeCalled();
  })
})

describe('when creating a new pubsub client, when topic already exists', () => {
  it('should be initiated with the configuration', async () => {
    const randomNumber = Math.random()

    const topicMock = new PubSub().topic('example') as MockedObject<Topic>
    const pubSubMock = new PubSub() as MockedObject<PubSub>
    
    /*topicMock.publishMessage.mockImplementation((data) => {
      console.log(data)
    })*/
    console.log('topicMock', topicMock)

    const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })

    

    const message = { messageType: 'TYPE', created: new Date() }
    await client
      .topic('example')
      .publish(message)

    expect(topicMock.publishMessage).toBeCalledWith({ json: message});
    /*expect(nuvarandeTopic.publish).toBeCalledWith({
      projectId: 'test',
    })*/

    //expect(mockTopic).toBeCalled();
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
