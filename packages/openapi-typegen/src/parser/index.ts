import { ComponentsObject, OpenApiDocument } from '@sebspark/openapi-core'
import { ParsedComponents, ParsedOpenApiDocument } from '../types'
import { parseSchemas } from './schema'
import { parsePaths } from './paths'
import { parseParameters } from './parameters'
import { parseHeaders } from './headers'
import { parseRequestBodies } from './requestBodies'
import { parseResponseBodies } from './responseBodies'

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
})
