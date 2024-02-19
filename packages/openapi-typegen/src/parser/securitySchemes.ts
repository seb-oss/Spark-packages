import { SecuritySchemeObject } from '@sebspark/openapi-core'
import { Parameter } from '../types'

export const parseSecuritySchemes = (
  schemes: Record<string, SecuritySchemeObject> = {}
): Parameter[] => {
  const parameters: Parameter[] = []
  for (const [name, scheme] of Object.entries(schemes)) {
    parameters.push(parseSecurityScheme(name, scheme))
  }
  return parameters
}

export const parseSecurityScheme = (
  name: string,
  scheme: SecuritySchemeObject
): Parameter => {
  switch (scheme.type) {
    case 'apiKey':
      return parseApiKey(name, scheme)
    case 'http':
      return parseHttpSecurity(name, scheme)
    case 'oauth2':
      return parseOAuth(name, scheme)
    case 'openIdConnect':
      return parseOpenIdConnect(name, scheme)
  }
  throw new Error(`Unknown security scheme '${scheme.type}'`)
}

const parseApiKey = (name: string, scheme: SecuritySchemeObject): Parameter => {
  const _in = scheme.in || 'header'
  const parameterName = scheme.name as string
  return {
    name,
    parameterName,
    in: _in,
    optional: false,
    type: { type: 'string' },
  }
}

const parseHttpSecurity = (
  name: string,
  _scheme: SecuritySchemeObject
): Parameter => ({
  name,
  in: 'header',
  parameterName: 'Authorization',
  optional: false,
  type: { type: 'string' },
})

const parseOAuth = (
  name: string,
  _scheme: SecuritySchemeObject
): Parameter => ({
  name,
  in: 'header',
  parameterName: 'Authorization',
  optional: false,
  type: { type: 'string' },
})

const parseOpenIdConnect = (
  name: string,
  _scheme: SecuritySchemeObject
): Parameter => ({
  name,
  in: 'header',
  parameterName: 'Authorization',
  optional: false,
  type: { type: 'string' },
})
