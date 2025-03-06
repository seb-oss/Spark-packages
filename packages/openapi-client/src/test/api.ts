import type {
  BaseClient,
  RequestOptions,
} from '@sebspark/openapi-core'

export type ApiClient = Pick<BaseClient, 'get'> & {
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
