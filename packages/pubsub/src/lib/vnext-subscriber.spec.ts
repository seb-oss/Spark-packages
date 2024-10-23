
import { describe, it, vi, expect } from 'vitest'
import type { PubSub } from '@google-cloud/pubsub'
//import { createPublisher, createSubscriber } from './vnext'
import { z } from 'zod'
import { zodToAvro } from './zod-to-avro';

const exampleSchema = z.object({
  messageType: z.string(),
  created: z.date(),
  data: z.string().optional()
});


type ExampleMessage = z.infer<typeof exampleSchema>;
const exampleAvroSchema = zodToAvro("Example", exampleSchema, { namespace: "com.acme.example" });

type ExamplePubsubChannels = {
  example: ExampleMessage
}

vi.mock('@google-cloud/pubsub', () => {
  const pubsub: Partial<PubSub> = {
    topic: vi.fn(),
  }

  return {
    PubSub: vi.fn().mockReturnValue(pubsub),
  }
})
  

const description = "This is an example message";
const zodValue = z.object(
  {
    messageType: z.string(),
    message: z.number(),
  },
  { description }
);
const avroSchema = zodToAvro("ExampleMessage", zodValue);

// When client is set up with project id. PUBSUB is beeing called with the correct things.
// When topic publish is run, we can se that correct data is beeing sent to the underlying things.
// check that _topic.publishMessage({ json: message }) has been called.

// When subsribe we can trigger the call back that is beeing registered.


/*
  things to test.
  - Initiation is run with the correct parrams.
  - Create subscrubtion
  - Get subscription
  - Process message?
*/

describe('when creating a new pubsub client the internal client', () => {
  it('should be initiated with the configuration', async () => {

      
    /*const client = createPublisher<ExamplePubsubChannels>({
      projectId: 'test',
    })

    client.topic("example", exampleAvroSchema);
    expect(PubSub).toBeCalledWith({
      projectId: 'test',
    })*/
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
