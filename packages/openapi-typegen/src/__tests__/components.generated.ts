/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

import type {
  APIResponse,
  APIServerDefinition,
  BaseClient,
  GenericRouteHandler,
  LowerCaseHeaders,
  PartiallySerialized,
  RequestOptions,
  Serialized,
} from '@sebspark/openapi-core'
import type { Request as ExpressRequest } from 'express'

type Req = Pick<ExpressRequest, 'url' | 'baseUrl' | 'cookies' | 'hostname'>

/* tslint:disable */
/* eslint-disable */

export type User = {
  id: string
  name?: string
  userType?: UserType
  userDetails?: UserDetails
}

export type UserList = User[]

export type UserType = 'HUMAN' | 'SYSTEM'

export type HumanDetails = {
  name?: string
}

export type SystemDetails = {
  version?: string
}

export type UserDetails = HumanDetails | SystemDetails

export type UserDetailsDiscriminator = {
  HUMAN: HumanDetails
  SYSTEM: SystemDetails
}

/**
 * The number of allowed requests in the current period
 */
export type XRateLimit = { 'X-Rate-Limit'?: number }

export type PageParam = {
  page?: number
}

export type LimitParam = {
  limit?: number
}

export type UserCreate = User

/**
 * Authentication information is missing or invalid
 */
export type UnauthorizedError = APIResponse<
  undefined,
  { 'WWW-Authenticate'?: string }
>

export type ApiKeyAuth = {
  'X-API-KEY': string
}

export type ExampleAPIServer = APIServerDefinition & {
  '/users': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {PageParam & LimitParam} [args.query] - Optional. Query parameters for the request.
       * @param {ApiKeyAuth} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<UserList>, {'X-Rate-Limit': XRateLimit, apiKey: string}>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<ApiKeyAuth>
          query?: PageParam & LimitParam
        },
      ) => Promise<
        [
          200,
          APIResponse<
            PartiallySerialized<UserList>,
            { 'X-Rate-Limit': XRateLimit; apiKey: string }
          >,
        ]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    post: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {ApiKeyAuth} args.headers - Headers for the request.
       * @param {UserCreate} args.body - Request body for the request.
       * @returns {Promise<[201, APIResponse<PartiallySerialized<User>>]>}
       */
      handler: (
        args: Req & { body: UserCreate; headers: LowerCaseHeaders<ApiKeyAuth> },
      ) => Promise<[201, APIResponse<PartiallySerialized<User>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/users/:userId': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.userId
       * @param {ApiKeyAuth} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<User>, {'x-api-key': string}>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<ApiKeyAuth>
          params: {
            userId: string
          }
        },
      ) => Promise<
        [200, APIResponse<PartiallySerialized<User>, { 'x-api-key': string }>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

export type ExampleAPIClient = Pick<BaseClient, 'get' | 'post'> & {
  get: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {PageParam & LimitParam} [args.query] - Optional. Query parameters for the request.
     * @param {ApiKeyAuth} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<UserList>, {'X-Rate-Limit': XRateLimit, apiKey: string}>>}
     */
    (
      url: '/users',
      args: { headers: ApiKeyAuth; query?: PageParam & LimitParam },
      opts?: RequestOptions,
    ): Promise<
      APIResponse<
        Serialized<UserList>,
        { 'X-Rate-Limit': XRateLimit; apiKey: string }
      >
    >
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.userId
     * @param {ApiKeyAuth} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<User>, {'x-api-key': string}>>}
     */
    (
      url: '/users/:userId',
      args: {
        headers: ApiKeyAuth
        params: {
          userId: string
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<User>, { 'x-api-key': string }>>
  }
  post: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {ApiKeyAuth} args.headers - Headers for the request.
     * @param {UserCreate} args.body - Request body for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<User>>>}
     */
    (
      url: '/users',
      args: { body: UserCreate; headers: ApiKeyAuth },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<User>>>
  }
}
