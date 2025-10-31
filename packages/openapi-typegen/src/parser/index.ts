import type { ComponentsObject, OpenApiDocument } from '@sebspark/openapi-core'
import type { ParsedComponents, ParsedOpenApiDocument } from '../types.js'
import { parseHeaders } from './headers.js'
import { parseParameters } from './parameters.js'
import { parsePaths } from './paths.js'
import { parseRequestBodies } from './requestBodies.js'
import { parseResponseBodies } from './responseBodies.js'
import { parseSchemas } from './schema.js'
import { parseSecuritySchemes } from './securitySchemes.js'

export const parseDocument = (
  schema: OpenApiDocument
): ParsedOpenApiDocument => ({
  paths: parsePaths(schema),
  components: parseComponents(schema.components),
})

export const parseComponents = (
  components: ComponentsObject = {}
): ParsedComponents => ({
  schemas: parseSchemas(components.schemas),
  headers: parseHeaders(components.headers),
  parameters: parseParameters(components.parameters),
  requestBodies: parseRequestBodies(components.requestBodies),
  responseBodies: parseResponseBodies(components.responses),
  securitySchemes: parseSecuritySchemes(components.securitySchemes),
})
