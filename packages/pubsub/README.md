# `@sebspark/pubsub`

## ⚠️ **Deprecated**

This library is built on faulty assumptions for **Google PubSub**

1. Topics and subscriptions should typically be created through Terraform or some other form of infrastructure as code
2. Same thing goes for Schemas
3. If a subscription is created in code, it should be unique and removed on SIGTERM
4. Topics should not handle more than one message type

Use vanilla [@google-cloud/pubsub](https://www.npmjs.com/package/@google-cloud/pubsub) instead!



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
