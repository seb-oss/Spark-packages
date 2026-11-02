import { createJwt, getRemoteJwt } from './jwt'
import type { Headers, JsonObject, Mode, ProxyConfig } from './types'
import {
  getHeader,
  IntrospectionError,
  parseAuthorizationHeader,
} from './utils'

const getAccessToken = async (
  mode: Mode,
  downstream: string | undefined,
  claims: JsonObject
) => {
  if (mode === 'local') return createJwt(claims)
  if (!downstream) {
    throw new Error('downstream URL is required when mode is downstream')
  }
  return getRemoteJwt(downstream, claims)
}

export const introspect = async (
  config: ProxyConfig,
  headers: Headers
): Promise<Headers> => {
  const authorizationHeader = getHeader(headers, 'authorization')
  if (!authorizationHeader) {
    return headers
  }
  if (typeof authorizationHeader !== 'string') {
    throw new IntrospectionError(String(authorizationHeader))
  }

  const claims = parseAuthorizationHeader(authorizationHeader)
  const mode: Mode = config.mode || (config.downstream ? 'downstream' : 'local')
  const access_token = await getAccessToken(mode, config.downstream, claims)

  return { ...headers, authorization: `Bearer ${access_token}` }
}
