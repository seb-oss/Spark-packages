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

export type XRateLimit = { 'X-Rate-Limit'?: number }

export type PageParam = {
  page?: number
}

export type LimitParam = {
  limit?: number
}

export type UserCreate = User

export type UnauthorizedError = APIResponse<
  never,
  {
    'WWW-Authenticate'?: string
  }
>

export type ExampleAPIServer = APIServerDefinition & {
  '/users': {
    get: {
      handler: (
        args?: Req & { query?: PageParam & LimitParam },
      ) => Promise<[200, UserList]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    post: {
      handler: (args: Req & { body: UserCreate }) => Promise<[201, User]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/users/:userId': {
    get: {
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
    (
      url: '/users',
      args?: { query?: PageParam & LimitParam },
      opts?: RequestOptions,
    ): Promise<UserList>
  
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
    (
      url: '/users',
      args: { body: UserCreate },
      opts?: RequestOptions,
    ): Promise<User>
  }
}
