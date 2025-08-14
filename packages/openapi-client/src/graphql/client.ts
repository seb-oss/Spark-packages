import {
  apiGatewayTokenByUrlGenerator,
  apiGatewayTokenRefresh,
} from '@sebspark/openapi-auth-iam'
import type { ClientOptions } from '@sebspark/openapi-core'
import type { Logger } from 'winston'

import { TypedClient } from '../client'
import type {
  GatewayGraphqlClientArgs,
  GatewayGraphqlClient as GatewayGraphqlClientType,
} from './types'

export class GatewayGraphqlClient<
  T extends GatewayGraphqlClientType = GatewayGraphqlClientType,
> {
  public client: T
  public logger: Logger
  private uri: string
  private options: ClientOptions

  constructor(args: GatewayGraphqlClientArgs) {
    this.uri = args.uri
    this.logger = args.logger
    this.options = {
      timeout: 10 * 1000,
      authorizationTokenGenerator: async (url) => {
        this.logger.debug(`Generating token for: ${this.uri}`)
        return apiGatewayTokenByUrlGenerator(args.apiKey)(url)
      },
      authorizationTokenRefresh: async (url) => {
        this.logger.debug(`Refreshing token for: ${this.uri}`)
        return apiGatewayTokenRefresh()(url)
      },
    }
    this.client = TypedClient<T>(args.uri, this.options, this.logger)
  }

  public async graphql<K>(query: string, variables?: Record<string, unknown>) {
    try {
      const response = await this.client.post('/graphql', {
        body: { query: query.trim(), variables },
      })

      if (response.data.errors) {
        this.logger.error(`Error posting graphql query to: ${this.uri}`)
        throw new Error(response.data.errors.map((e) => e.message).join('\n'))
      }

      return response.data.data as K
    } catch (error) {
      this.logger.error(`Error posting graphql: ${this.uri}`)
      throw error
    }
  }

  public async isHealthy() {
    try {
      await this.client.get('/health')
      return true
    } catch (error) {
      this.logger.error(error)
    }
    return false
  }
}
