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
import type { Request as ExpressRequest } from 'express-serve-static-core'

type Req = Pick<ExpressRequest, 'url' | 'baseUrl' | 'cookies' | 'hostname'>

/* tslint:disable */
/* eslint-disable */

export type UserList = User[]

export type User = {
  id: string
  name: string
  age: number
}

export type HttpError = {
  message: string
  stack?: string
}

/**
 * Unauthorized
 */
export type UnauthorizedErrorResponse = APIResponse<
  PartiallySerialized<HttpError>
>

/**
 * Forbidden
 */
export type ForbiddenErrorResponse = APIResponse<PartiallySerialized<HttpError>>

/**
 * NotFound
 */
export type NotFoundErrorResponse = APIResponse<PartiallySerialized<HttpError>>

export type AccessToken = {
  Authorization: string
}

export type OpenapiServer = APIServerDefinition & {
  '/users': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {accessToken} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<UserList>>]>}
       */
      handler: (
        args: Req & { headers: LowerCaseHeaders<AccessToken> }
      ) => Promise<[200, APIResponse<PartiallySerialized<UserList>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    post: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {accessToken} args.headers - Headers for the request.
       * @param {User} args.body - Request body for the request.
       * @returns {Promise<[201, APIResponse<PartiallySerialized<User>>]>}
       */
      handler: (
        args: Req & { body: User; headers: LowerCaseHeaders<AccessToken> }
      ) => Promise<[201, APIResponse<PartiallySerialized<User>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/users/:userId': {
    delete: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.userId
       * @param {accessToken} args.headers - Headers for the request.
       * @returns {Promise<[204, undefined]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<AccessToken>
          params: {
            userId: string
          }
        }
      ) => Promise<[204, undefined]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.userId
       * @param {accessToken} args.headers - Headers for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<User>>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<AccessToken>
          params: {
            userId: string
          }
        }
      ) => Promise<[200, APIResponse<PartiallySerialized<User>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    put: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.userId
       * @param {accessToken} args.headers - Headers for the request.
       * @param {User} args.body - Request body for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<User>>]>}
       */
      handler: (
        args: Req & {
          body: User
          headers: LowerCaseHeaders<AccessToken>
          params: {
            userId: string
          }
        }
      ) => Promise<[200, APIResponse<PartiallySerialized<User>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/undocumented-security': {
    get: {
      /**
       *
       * @returns {Promise<[204, undefined]>}
       */
      handler: (args: Req) => Promise<[204, undefined]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/undocumented-security/:id': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.id
       * @returns {Promise<[204, undefined]>}
       */
      handler: (
        args: Req & {
          params: {
            id: string
          }
        }
      ) => Promise<[204, undefined]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/search': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.query - Query parameters.
       * @param {Array<string>} args.query.type
       * @returns {Promise<[200, APIResponse<{ received: string[] }>>}
       */
      handler: (
        args: Req & {
          query: {
            type: string[]
          }
        }
      ) => Promise<[200, APIResponse<{ received: string[] }>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

export type OpenapiClient = Pick<
  BaseClient,
  'get' | 'post' | 'delete' | 'put'
> & {
  get: {
    (
      url: '/search',
      args: {
        query: {
          type: string[]
        }
      },
      opts?: RequestOptions
    ): Promise<APIResponse<{ received: string | string[] }>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {accessToken} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<UserList>>>}
     */
    (
      url: '/users',
      args: { headers: AccessToken },
      opts?: RequestOptions
    ): Promise<APIResponse<Serialized<UserList>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.userId
     * @param {accessToken} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<User>>>}
     */
    (
      url: '/users/:userId',
      args: {
        headers: AccessToken
        params: {
          userId: string
        }
      },
      opts?: RequestOptions
    ): Promise<APIResponse<Serialized<User>>>
    /**
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<undefined>}
     */
    (url: '/undocumented-security', opts?: RequestOptions): Promise<undefined>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.id
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<undefined>}
     */
    (
      url: '/undocumented-security/:id',
      args: {
        params: {
          id: string
        }
      },
      opts?: RequestOptions
    ): Promise<undefined>
  }
  post: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {accessToken} args.headers - Headers for the request.
     * @param {User} args.body - Request body for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<User>>>}
     */
    (
      url: '/users',
      args: { body: User; headers: AccessToken },
      opts?: RequestOptions
    ): Promise<APIResponse<Serialized<User>>>
  }
  delete: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.userId
     * @param {accessToken} args.headers - Headers for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<undefined>}
     */
    (
      url: '/users/:userId',
      args: {
        headers: AccessToken
        params: {
          userId: string
        }
      },
      opts?: RequestOptions
    ): Promise<undefined>
  }
  put: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.userId
     * @param {accessToken} args.headers - Headers for the request.
     * @param {User} args.body - Request body for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<User>>>}
     */
    (
      url: '/users/:userId',
      args: {
        body: User
        headers: AccessToken
        params: {
          userId: string
        }
      },
      opts?: RequestOptions
    ): Promise<APIResponse<Serialized<User>>>
  }
}
