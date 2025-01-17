# `@sebspark/pubsub`

A wrapper around [@google-cloud/pubsub](https://www.npmjs.com/package/@google-cloud/pubsub) adding simple methods for publishing and subscribing with typed messages.

## Examples

```typescript
type ExampleMessage = {
  messageType: string;
  message: string;
};

type ExamplePubsubChannels = {
  example: ExampleMessage;
};
```

### SubscriptionClient

```typescript
// Instantiate subscriber.
const subscriber = createSubscriber<ExamplePubsubChannels>({
  projectId: "test",
});

// Ensure
await subscriber.topic("example").initiate("example_subscription", {
  autoAck: false, // false means you need to call acc or nack in the message event handler.
  expirationPolicy: 3600 * 24, // Seconds.
  messageRetentionDuration: 3600 * 27 * 7, // Seconds
});

await subscriber.topic("example").subscribe("example_subscription", {
  onMessage: async (message: TypedMessage<ExampleMessage>) => {
    try {
      // Do something.

      // Ack message.
      message.ack();
    } catch (err) {
      console.error(err);

      // Nack message.
      message.nack();
    }
  },
});
```

## PubSubOptions

`SubscriptionClient` supports a simplified subset of the options from `@google-cloud/pubsub` and a custom parameter that decides the ack/nack behavior of messages.

```typescript
export type PubSubOptions = {
  expirationPolicy: number;
  messageRetentionDuration: number;
  autoAck?: boolean; // Default true
};
```

Set `autoAck` to false if you want to ack/nack messages manually in your message handler.
