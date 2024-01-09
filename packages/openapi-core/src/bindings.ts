import { HttpMethod, ReferenceObject, SchemaObject } from './common'

export type ChannelBindingsObject = {
  http?: HttpChannelBindingObject
  ws?: WebSocketChannelBindingObject
  kafka?: KafkaChannelBindingObject
  redis?: RedisChannelBindingObject
  rabbitmq?: RabbitMQChannelBindingObject
  googlepubsub?: GooglePubSubChannelBindingObject
  // ... any other specific bindings as per AsyncAPI spec ...
}

// Definitions for other binding objects (WebSocket, Kafka, etc.) go here.
// Each binding object type should be defined according to its specific configuration requirements.
export type HttpChannelBindingObject = {
  type: string
  method: string
  query: SchemaObject | ReferenceObject
  bindingVersion?: string
}

export type WebSocketChannelBindingObject = {
  type: string
  method: string
  query: SchemaObject | ReferenceObject
  headers: SchemaObject | ReferenceObject
  bindingVersion?: string
}

export type KafkaChannelBindingObject = {
  groupId?: SchemaObject | ReferenceObject
  clientId?: SchemaObject | ReferenceObject
  bindingVersion?: string
}

export type RedisChannelBindingObject = {
  type: string
  method: string
  query: SchemaObject | ReferenceObject
  bindingVersion?: string
}

export type RabbitMQChannelBindingObject = {
  is: string
  exchange: {
    name: string
    type: string
    durable: boolean
    autoDelete: boolean
    vhost: string
  }
  queue: {
    name: string
    durable: boolean
    exclusive: boolean
    autoDelete: boolean
    vhost: string
  }
  bindingVersion?: string
}

export type GooglePubSubChannelBindingObject = {
  topic: {
    name: string
  }
  subscription: {
    name: string
  }
  bindingVersion?: string
}

export type OperationBindingsObject = {
  ws?: WebSocketOperationBindingObject
  http?: HttpOperationBindingObject
  kafka?: KafkaOperationBindingObject
  redis?: RedisOperationBindingObject
  rabbitmq?: RabbitMQOperationBindingObject
  googlepubsub?: GooglePubSubOperationBindingObject
  // ... add other protocol specific binding objects here ...
}

export type OperationType = 'publish' | 'subscribe'
export type MessageFormat = 'json' | 'xml' | 'text' | 'binary'

export type WebSocketOperationBindingObject = {
  // Indicates the type of operation (e.g., publish, subscribe)
  type?: OperationType
  // The method to establish the WebSocket connection, if applicable
  method?: 'GET'
  // A SchemaObject or a ReferenceObject describing the query parameters used when establishing the WebSocket connection
  query?: SchemaObject | ReferenceObject
  // A SchemaObject or a ReferenceObject describing the headers used when establishing the WebSocket connection
  headers?: SchemaObject | ReferenceObject
  // The message format to be used (e.g., JSON, XML, etc.)
  messageFormat?: MessageFormat
  // Indicates whether the WebSocket connection is persistent or not
  persistent?: boolean
  // The version of this binding object
  bindingVersion?: string
}

export type HttpOperationBindingObject = {
  type: 'request' | 'response'
  method: HttpMethod
  query?: SchemaObject | ReferenceObject
  bindingVersion?: string
}

export type KafkaOperationBindingObject = {
  groupId?: {
    type: 'string'
    description?: string // A description of what the group ID represents
    // Any additional properties as per Kafka's group ID specifications
  }
  clientId?: {
    type: 'string'
    description?: string // A description of what the client ID represents
    // Any additional properties as per Kafka's client ID specifications
  }
  bindingVersion?: string // The version of this binding object
  // Other standard properties relevant to Kafka operation bindings
}

export type RedisOperationBindingObject = {
  // Indicates the Redis command type, e.g., 'PUBLISH', 'SUBSCRIBE'
  command?: 'PUBLISH' | 'SUBSCRIBE'
  // Specifies the Redis channel this operation refers to
  channel?: string
  // The version of this binding object
  bindingVersion?: string
  // Any additional standard properties relevant to Redis operation bindings
  // ...
}

export type RabbitMQOperationBindingObject = {
  // Specifies the type of exchange
  exchangeType?: 'direct' | 'fanout' | 'topic' | 'headers'
  // The name of the exchange
  exchangeName?: string
  // Indicates whether the exchange is durable (survives broker restart)
  durable?: boolean
  // Indicates whether the exchange is auto-deleted when last queue is unbound from it
  autoDelete?: boolean
  // Virtual host of the exchange
  vhost?: string
  // The version of this binding object
  bindingVersion?: string
  // Any other standard properties relevant to RabbitMQ operation bindings
  // ...
}

export type GooglePubSubOperationBindingObject = {
  ackDeadlineSeconds?: number
  retryPolicy?: GooglePubSubRetryPolicy
  deadLetterPolicy?: GooglePubSubDeadLetterPolicy
  detachSubscription?: boolean
  messageRetentionDuration?: string
  filter?: string
  bindingVersion?: string
}

export type GooglePubSubRetryPolicy = {
  minimumBackoff?: string
  maximumBackoff?: string
}

export type GooglePubSubDeadLetterPolicy = {
  deadLetterTopic?: string
  maxDeliveryAttempts?: number
}

export type MessageBindingsObject = {
  http?: HttpMessageBindingObject
  ws?: WebSocketMessageBindingObject
  kafka?: KafkaMessageBindingObject
  redis?: RedisMessageBindingObject
  rabbitmq?: RabbitMQMessageBindingObject
  googlepubsub?: GooglePubSubMessageBindingObject
  // ... other protocol specific message bindings ...
}

type MessageBindingObject = {
  headers?: SchemaObject | ReferenceObject
  bindingVersion?: string // The version of this binding object
}

export type HttpMessageBindingObject = MessageBindingObject & {}

export type WebSocketMessageBindingObject = MessageBindingObject & {
  // Define properties specific to WebSocket message binding
}

export type KafkaMessageBindingObject = MessageBindingObject & {
  // Define properties specific to Kafka message binding
}

export type RedisMessageBindingObject = MessageBindingObject & {
  // Define properties specific to Redis message binding
}

export type RabbitMQMessageBindingObject = MessageBindingObject & {
  // Define properties specific to RabbitMQ message binding
}

export type GooglePubSubMessageBindingObject = MessageBindingObject & {
  // Define properties specific to Google Pub/Sub message binding
}

export type ServerBindingsObject = {
  http?: HttpServerBindingObject
  ws?: WebSocketServerBindingObject
  kafka?: KafkaServerBindingObject
  mqtt?: MqttServerBindingObject
  amqp?: AmqpServerBindingObject
  // ... other protocol specific server bindings ...
}

type BaseServerBindingObject = {
  bindingVersion?: string // The version of this binding object
}

export type HttpServerBindingObject = BaseServerBindingObject & {
  // HTTP-specific server binding properties
  // Define properties as per the specific requirements for HTTP
}

export type WebSocketServerBindingObject = BaseServerBindingObject & {
  // WebSocket-specific server binding properties
  // Define properties as per the specific requirements for WebSocket
}

export type KafkaServerBindingObject = BaseServerBindingObject & {
  // Kafka-specific server binding properties
  // Define properties as per the specific requirements for Kafka
}

export type MqttServerBindingObject = BaseServerBindingObject & {
  // MQTT-specific server binding properties
  // Define properties as per the specific requirements for MQTT
}

export type AmqpServerBindingObject = BaseServerBindingObject & {
  // AMQP-specific server binding properties
  // Define properties as per the specific requirements for AMQP
}
