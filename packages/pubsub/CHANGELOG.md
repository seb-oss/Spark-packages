# @sebspark/pubsub

## 1.6.1

### Patch Changes

- cde53cf: Add missing methods to SubscriptionClient type.

## 1.6.0

### Minor Changes

- 63b515f: Add methods for closing and deleting a subscription.

## 1.5.6

### Patch Changes

- 6829923: publish must be called with a Buffer but is not typed as such 🤯

## 1.5.5

### Patch Changes

- dd76d7f: Fixed error in publish with updated gogogle pubsub pkg

## 1.5.4

### Patch Changes

- e54d2b7: Updated dependencies

## 1.5.3

### Patch Changes

- 8308772: Updated vulnerable dependencies (express and axios)

## 1.5.2

### Patch Changes

- ffdebbf: Can create topic without schema

## 1.5.1

### Patch Changes

- a39b6d0: Fixed bug that broke topic.initiate, leading to subscription creation failing.

## 1.5.0

### Minor Changes

- 7a037e0: Subscribe does not create a subscription. Use initiate.

## 1.4.0

### Minor Changes

- 3863ff2: Publish Avro Json to PubSub

## 1.3.1

### Patch Changes

- d732bd9: Testing publishMessage and message

## 1.3.0

### Minor Changes

- 550801c: Use avro when there is a schema associated with the topic

## 1.2.0

### Minor Changes

- 34eab98: Subscriptions now automatically ack messages if not overriden.

## 1.1.2

### Patch Changes

- eb0180c: Only use JSON for sending messages

## 1.1.1

### Patch Changes

- e8d34a4: Only associate schema when topic are created
- 3cd36af: Changes what data is sent when updating metadata for a topic.

## 1.1.0

### Minor Changes

- aca855c: Fixes bug that did not check if a schema exists in the correct way.

## 1.0.0

### Major Changes

- 9265ac7: A new two part client with a publisher and a subscriber

## 0.6.3

### Patch Changes

- ad4311e: Updated vulnerable express dependency

## 0.6.2

### Patch Changes

- 93a37b3: Patch dependencies

## 0.6.1

### Patch Changes

- 938d7b5: Updated express to fix CVE-2024-29041

## 0.6.0

### Minor Changes

- 78c0f60: Bump @google-cloud/pubsub dependency to 4.\*

## 0.5.1

### Patch Changes

- ec60d2a: Improved type safety

## 0.5.0

### Minor Changes

- 1112b62: - Added support for credentials
  - Bugfixes

### Patch Changes

- 41af766: Adding NPM keywords

## 0.4.0

### Minor Changes

- b868ede: Support initiating PubSub with projectId

## 0.3.0

### Minor Changes

- 60f1482: Support unwrapped messages for legacy integrations.

## 0.2.4

### Patch Changes

- c01e35d: Updated vulnerable dependencies

## 0.2.3

### Patch Changes

- 13148cc: Publish TypeScript configuration

## 0.2.2

### Patch Changes

- d60c58f: Replace escape-goat

## 0.2.1

### Patch Changes

- 41cd158: Fix deps

## 0.2.0

### Minor Changes

- 2b29777: Shipping dependencies from now on.

## 0.1.1

### Patch Changes

- 3650622: Update build to output CommonJS and ES Module

## 0.1.0

### Minor Changes

- 1472464: Add pubsub functionality

## 0.0.2

### Patch Changes

- 92e36c3: Update publish directory to built output

## 0.0.1

### Patch Changes

- f3569e9: Test updating a release
- ec53121: Test initial release
