import type {
  APIResponse,
  BaseClient,
  RequestOptions,
} from '@sebspark/openapi-core'

export type GatewayGraphqlClient = Pick<BaseClient, 'post' | 'get'> & {
  post: {
    /**
         *
         * @param {string} url
         * @param {Object} [args] - Optional. The arguments for the request.
         * @param {Object} [args.body] - Optional. Request body for the request.
         * @param {string} [args.body.query] - Optional.
         * @param {object} [args.body.variables] - Optional.
         * @param {RequestOptions} [opts] - Optional.
         * @returns {Promise<APIResponse<{
         }>>}
         */
    (
      url: '/graphql',
      args?: {
        body?: {
          query?: string
          variables?: Record<string, unknown>
        }
      },
      opts?: RequestOptions
    ): Promise<
      APIResponse<{
        // biome-ignore lint/suspicious/noExplicitAny: it is any
        data: Record<string, any>
        // biome-ignore lint/suspicious/noExplicitAny: it is any[]
        errors?: ({ message: string } & Record<string, any>)[]
      }>
    >
  }
  get: {
    /**
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<undefined>}
     */
    (url: '/health', opts?: RequestOptions): Promise<undefined>
  }
}

export type GatewayGraphqlClientArgs = {
  uri: string
  apiKey: string

}
