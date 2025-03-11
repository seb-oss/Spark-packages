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
  return async (url: string): Promise<Record<string, string>> => {
    const token = await getApiGatewayTokenByUrl({
      apiURL: url,
      logger,
    })

    return {
      'Proxy-Authorization': `Bearer ${token}`,
      'x-api-key': apiKey,
    }
  }
}

export const apiGatewayTokenByClientIdGenerator = (
  apiKey: string,
  clientId: string
) => {
  return async (): Promise<Record<string, string>> => {
    const token = await getApiGatewayTokenByClientId(clientId)

    return {
      'Proxy-Authorization': `Bearer ${token}`,
      'x-api-key': apiKey,
    }
  }
}

export const apiGatewayTokenRefresh = () => {
  return async (url: string) => {
    return await clearCache(url)
  }
}
