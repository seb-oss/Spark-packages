
import type { ClientOptions } from '@sebspark/openapi-core'
import { getLogger } from '@sebspark/otel'
import { TypedClient } from '../client'
import type {
  GatewayGraphqlClientArgs,
  GatewayGraphqlClient as GatewayGraphqlClientType,
} from './types'

export class GatewayGraphqlClient<
  T extends GatewayGraphqlClientType = GatewayGraphqlClientType,
> {
  public client: T
  public logger: ReturnType<typeof getLogger>
  private uri: string
  private options: ClientOptions

  constructor(args: GatewayGraphqlClientArgs) {
    this.uri = args.uri
    this.logger = getLogger('GatewayGraphqlClient')
    this.options = {
      headers: {
        'x-api-key': args.apiKey,
      },
    }
    this.client = TypedClient<T>(args.uri, this.options)
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
      this.logger.error(error as Error)
    }
    return false
  }
}
