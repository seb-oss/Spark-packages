export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'

export type SchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'

export type SchemaEnum = string[] | number[] | boolean[]

// biome-ignore lint/suspicious/noExplicitAny: not our decision
export type DefaultValue = string | number | boolean | any[] | any

// biome-ignore lint/suspicious/noExplicitAny: not our decision
export type Example = any

export type ExampleObject = {
  summary?: string
  description?: string
  value?: Example
  externalValue?: string
}

export type SchemaObject = {
  title?: string
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[]
  enum?: SchemaEnum
  type?: SchemaType | SchemaType[]
  allOf?: (SchemaObject | ReferenceObject)[]
  oneOf?: (SchemaObject | ReferenceObject)[]
  anyOf?: (SchemaObject | ReferenceObject)[]
  not?: SchemaObject | ReferenceObject
  items?: SchemaObject | ReferenceObject
  properties?: Record<string, SchemaObject | ReferenceObject>
  additionalProperties?: boolean | SchemaObject | ReferenceObject
  description?: string
  format?: string
  default?: DefaultValue
  nullable?: boolean
  discriminator?: DiscriminatorObject
  readOnly?: boolean
  writeOnly?: boolean
  xml?: XMLObject
  externalDocs?: ExternalDocumentationObject
  example?: Example
  deprecated?: boolean
}

export type XMLObject = {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean
}

export type ParameterIn = 'query' | 'header' | 'path' | 'cookie'
export type ParameterStyle =
  | 'matrix'
  | 'label'
  | 'form'
  | 'simple'
  | 'spaceDelimited'
  | 'pipeDelimited'
  | 'deepObject'

export type ParameterObject = {
  name: string
  in: ParameterIn
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean

  style?: ParameterStyle
  explode?: boolean
  allowReserved?: boolean
  schema?: SchemaObject | ReferenceObject
  example?: Example
  examples?: Record<string, ExampleObject | ReferenceObject>
  content?: Record<string, MediaTypeObject>
}

export type MediaTypeObject = {
  schema?: SchemaObject | ReferenceObject
  example?: Example
  examples?: Record<string, ExampleObject | ReferenceObject>
  encoding?: Record<string, EncodingObject>
}

export type EncodingObject = {
  contentType?: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  style?: string
  explode?: boolean
  allowReserved?: boolean
}

export type HeaderStyle = 'simple'

export type HeaderObject = {
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: HeaderStyle
  explode?: boolean
  allowReserved?: boolean
  schema?: SchemaObject | ReferenceObject
  example?: Example
  examples?: Record<string, ExampleObject | ReferenceObject>
  content?: Record<string, MediaTypeObject>
}

export type DiscriminatorObject = {
  propertyName: string
  mapping?: Record<string, string>
}

export type ReferenceObject = {
  $ref: string
}

export type InfoObject = {
  title: string
  summary?: string
  description?: string
  termsOfService?: string
  contact?: ContactObject
  license?: LicenseObject
  version: string
}

export type ContactObject = {
  name?: string
  url?: string
  email?: string
}

export type LicenseObject = {
  name: string
  url?: string
}

export type ServerObject = {
  url: string
  description?: string
  variables?: Record<string, ServerVariableObject>
}

export type ServerVariableObject = {
  default: string
  enum?: string[]
  description?: string
}

export type TagObject = {
  name: string
  description?: string
  externalDocs?: ExternalDocumentationObject
}

export type ExternalDocumentationObject = {
  description?: string
  url: string
}

export type SecuritySchemeType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'

export type SecuritySchemeObject = {
  type: SecuritySchemeType
  description?: string
  name?: string
  in?: ParameterIn
  scheme?: string
  bearerFormat?: string
  flows?: OAuthFlowsObject
  openIdConnectUrl?: string
}

export type OAuthFlowsObject = {
  implicit?: OAuthFlowObject
  password?: OAuthFlowObject
  clientCredentials?: OAuthFlowObject
  authorizationCode?: OAuthFlowObject
}

export type OAuthFlowObject = {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}
