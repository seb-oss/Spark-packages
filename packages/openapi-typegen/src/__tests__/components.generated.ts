/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

import type {
  APIResponse,
  APIServerDefinition,
  BaseClient,
  GenericRouteHandler,
  RequestOptions,
} from '@sebspark/openapi-core'
import type { Request } from 'express'

type Req = Pick<Request, 'url' | 'baseUrl' | 'cookies' | 'hostname'>

/* tslint:disable */
/* eslint-disable */

export type User = {
  id: string
  name?: string
}

export type UserList = User[]

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

export type UnauthorizedError = APIResponse<
  undefined,
  {
    'WWW-Authenticate'?: string
  }
>

export type ExampleAPIServer = APIServerDefinition & {
  '/users': {
    get: {
      /**
       *
       * @param {Object} [args] - Optional. The arguments for the request.
       * @param {PageParam & LimitParam} [args.query] - Optional. Query parameters for the request.
       * @returns {Promise<[200, UserList]>}
       */
      handler: (
        args?: Req & { query?: PageParam & LimitParam },
      ) => Promise<[200, UserList]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    post: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {UserCreate} args.body - Request body for the request.
       * @returns {Promise<[201, User]>}
       */
      handler: (args: Req & { body: UserCreate }) => Promise<[201, User]>
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
       * @returns {Promise<[200, User]>}
       */
      handler: (
        args: Req & {
          params: {
            userId: string
          }
        }
      ) => Promise<[200, User]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

export type ExampleAPIClient = Pick<BaseClient, 'get' | 'post'> & {
  get: {
    /**
     *
     * @param {string} url
     * @param {Object} [args] - Optional. The arguments for the request.
     * @param {PageParam & LimitParam} [args.query] - Optional. Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<UserList>}
     */
    (
      url: '/users',
      args?: { query?: PageParam & LimitParam },
      opts?: RequestOptions,
    ): Promise<UserList>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.userId
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<User>}
     */
    (
      url: '/users/:userId',
      args: {
        params: {
          userId: string
        }
      },
      opts?: RequestOptions,
    ): Promise<User>
  }
  post: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {UserCreate} args.body - Request body for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<User>}
     */
    (
      url: '/users',
      args: { body: UserCreate },
      opts?: RequestOptions,
    ): Promise<User>
  }
}
