import { createJwt, getRemoteJwt } from './jwt'
import type { Headers, Mode, ProxyConfig } from './types'
import { getHeader, parseAuthorizationHeader } from './utils'

export const introspect = async (
  config: ProxyConfig,
  headers: Headers
): Promise<Headers> => {
  const authorizationHeader = getHeader(headers, 'authorization') as string
  if (!authorizationHeader) {
    return headers
  }

  const claims = parseAuthorizationHeader(authorizationHeader)
  const mode: Mode = config.mode || (config.downstream ? 'downstream' : 'local')
  const access_token = await (mode === 'local'
    ? createJwt(claims)
    : getRemoteJwt(config.downstream as string, claims))

  return { ...headers, authorization: `Bearer ${access_token}` }
}
