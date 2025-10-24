import {
  clearCache,
  getApiGatewayTokenByClientId,
  getApiGatewayTokenByUrl,
} from '@sebspark/gcp-iam'

export const apiGatewayTokenByUrlGenerator = (apiKey: string) => {
  return async (url: string): Promise<Record<string, string>> => {
    const token = await getApiGatewayTokenByUrl({
      apiURL: url,
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
