/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

import type {
  APIServerDefinition,
  BaseClient,
  GenericRouteHandler,
} from '@sebspark/openapi-core'
import type { Request } from 'express'

type Req = Pick<Request, 'url' | 'baseUrl' | 'cookies' | 'hostname'>

/* tslint:disable */
/* eslint-disable */

export type User = { id?: string; name?: string }

export type UserList = User[]

export type ExampleAPIServer = APIServerDefinition & {
  '/users': {
    get: {
      handler: (
        args?: Req & { query?: { page?: number; limit?: number } },
      ) => Promise<[200, UserList]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    post: {
      handler: (args: Req & { body: User }) => Promise<[201, User]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/users/:userId': {
    get: {
      handler: (
        args: Req & { params: { userId: string } },
      ) => Promise<[200, User]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

type ExampleAPIClientGet = {
  (
    url: '/users',
    args?: { query?: { page?: number; limit?: number } },
  ): Promise<UserList>

  (url: '/users/:userId', args: { params: { userId: string } }): Promise<User>
}

type ExampleAPIClientPost = {
  (url: '/users'): Promise<User>
}

export type ExampleAPIClient = Pick<BaseClient, 'get' | 'post'> & {
  get: ExampleAPIClientGet
  post: ExampleAPIClientPost
}
