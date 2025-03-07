import {
  clearCache,
  getApiGatewayTokenByClientId,
  getApiGatewayTokenByUrl,
} from '@sebspark/gcp-iam'
import type { Logger } from 'winston'

export const apiGatewayTokenByUrlGenerator = (
  apiKey: string,
  logger?: Logger
) => {
  return async (url: string): Promise<Map<string, string>> => {
    const token = await getApiGatewayTokenByUrl({
      apiURL: url,
      logger,
    })

    return new Map<string, string>([
      ['Proxy-Authorization', `Bearer ${token}`],
      ['x-api-key', apiKey],
    ])
  }
}

export const apiGatewayTokenByClientIdGenerator = (
  apiKey: string,
  clientId: string
) => {
  return async (): Promise<Map<string, string>> => {
    const token = await getApiGatewayTokenByClientId(clientId)

    return new Map<string, string>([
      ['Proxy-Authorization', `Bearer ${token}`],
      ['x-api-key', apiKey],
    ])
  }
}

export const apiGatewayTokenRefresh = () => {
  return async (url: string) => {
    return await clearCache(url)
  }
}
