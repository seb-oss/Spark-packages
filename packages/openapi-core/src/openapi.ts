import type {
  ExampleObject,
  ExternalDocumentationObject,
  HeaderObject,
  InfoObject,
  MediaTypeObject,
  ParameterObject,
  ReferenceObject,
  SchemaObject,
  SecuritySchemeObject,
  ServerObject,
  TagObject,
} from './common'

// Example of expanding the schema with other OpenAPI components
export type OpenApiDocument = {
  openapi: string
  info: InfoObject
  jsonSchemaDialect?: string
  servers?: ServerObject[]
  paths: Record<string, PathItemObject | ReferenceObject>
  webhooks?: Record<string, PathItemObject | ReferenceObject>
  components?: ComponentsObject
  security?: SecurityRequirementObject[]
  tags?: TagObject[]
  externalDocs?: ExternalDocumentationObject
}

export type PathItemObject = {
  summary?: string
  description?: string
  get?: OperationObject
  put?: OperationObject
  post?: OperationObject
  delete?: OperationObject
  options?: OperationObject
  head?: OperationObject
  patch?: OperationObject
  trace?: OperationObject
  servers?: ServerObject[]
  parameters?: (ParameterObject | ReferenceObject)[]
}

export type OperationObject = {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: ExternalDocumentationObject
  operationId?: string
  parameters?: (ParameterObject | ReferenceObject)[]
  requestBody?: RequestBodyObject | ReferenceObject
  responses: ResponsesObject
  callbacks?: Record<string, CallbackObject | ReferenceObject>
  deprecated?: boolean
  security?: SecurityRequirementObject[]
  servers?: ServerObject[]
}

export type RequestBodyObject = {
  description?: string
  content: Record<'application/json' | (string & {}), MediaTypeObject>
  required?: boolean
}

export type ResponsesObject = Record<string, ResponseObject | ReferenceObject>

export type ResponseObject = {
  description: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  content?: Record<'application/json' | (string & {}), MediaTypeObject>
  links?: Record<string, LinkObject | ReferenceObject>
}

export type ComponentsObject = {
  schemas?: Record<string, SchemaObject>
  responses?: Record<string, ResponseObject>
  parameters?: Record<string, ParameterObject>
  examples?: Record<string, ExampleObject>
  requestBodies?: Record<string, RequestBodyObject>
  headers?: Record<string, HeaderObject>
  securitySchemes?: Record<string, SecuritySchemeObject>
  links?: Record<string, LinkObject>
  callbacks?: Record<string, CallbackObject>
  pathItems?: Record<string, PathItemObject>
}

// biome-ignore lint/suspicious/noExplicitAny: not our definition
type RequestBody = any

export type LinkObject = {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, string>
  requestBody?: RequestBody
  description?: string
  server?: ServerObject
}

export type CallbackObject = Record<string, PathItemObject | ReferenceObject>

export type SecurityRequirementObject = Record<string, string[]>
