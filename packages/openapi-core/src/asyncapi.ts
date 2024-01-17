import {
  ChannelBindingsObject,
  MessageBindingsObject,
  OperationBindingsObject,
  ServerBindingsObject,
} from './bindings'
import {
  Example,
  ExternalDocumentationObject,
  InfoObject,
  ParameterObject,
  ReferenceObject,
  SchemaObject,
  SecuritySchemeObject,
  ServerObject,
  TagObject,
} from './common'

export type AsyncApiDocument = {
  asyncapi: string
  id?: string
  info: InfoObject
  servers?: Record<string, ServerObject>
  defaultContentType?: string
  channels: Record<string, ChannelItemObject>
  components?: AsyncApiComponentsObject
  tags?: TagObject[]
  externalDocs?: ExternalDocumentationObject
}

export type ChannelItemObject = {
  $ref?: string
  description?: string
  subscribe?: AsyncOperationObject
  publish?: AsyncOperationObject
  parameters?: Record<string, ParameterObject | ReferenceObject>
  bindings?: ChannelBindingsObject
}

// Note: AsyncOperationObject is similar to the one in OpenAPI but tailored for messaging.
export type AsyncOperationObject = {
  tags?: TagObject[]
  summary?: string
  description?: string
  externalDocs?: ExternalDocumentationObject
  operationId?: string
  traits?: OperationTraitObject[]
  message?: MessageObject | ReferenceObject
}

export type MessageObject = {
  headers?: SchemaObject | ReferenceObject
  payload?: SchemaObject | ReferenceObject
  correlationId?: CorrelationIdObject | ReferenceObject
  schemaFormat?: string
  contentType?: string
  name?: string
  title?: string
  summary?: string
  description?: string
  tags?: TagObject[]
  externalDocs?: ExternalDocumentationObject
  bindings?: MessageBindingsObject
  examples?: Example[]
  traits?: MessageTraitObject[]
}

export type AsyncApiComponentsObject = {
  schemas?: Record<string, SchemaObject | ReferenceObject>
  messages?: Record<string, MessageObject | ReferenceObject>
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>
  parameters?: Record<string, ParameterObject | ReferenceObject>
  correlationIds?: Record<string, CorrelationIdObject | ReferenceObject>
  operationTraits?: Record<string, OperationTraitObject | ReferenceObject>
  messageTraits?: Record<string, MessageTraitObject | ReferenceObject>
  serverBindings?: Record<string, ServerBindingsObject | ReferenceObject>
  channelBindings?: Record<string, ChannelBindingsObject | ReferenceObject>
  messageBindings?: Record<string, MessageBindingsObject | ReferenceObject>
}

export type OperationTraitObject = {
  operationId?: string
  summary?: string
  description?: string
  tags?: TagObject[]
  externalDocs?: ExternalDocumentationObject
  bindings?: OperationBindingsObject
  message?: MessageTraitObject | ReferenceObject
}

export type MessageTraitObject = {
  headers?: SchemaObject | ReferenceObject
  correlationId?: CorrelationIdObject | ReferenceObject
  schemaFormat?: string
  contentType?: string
  name?: string
  title?: string
  summary?: string
  description?: string
  tags?: TagObject[]
  externalDocs?: ExternalDocumentationObject
  examples?: Example[]
  bindings?: MessageBindingsObject
}

export type CorrelationIdObject = {
  description?: string
  location: string
}
