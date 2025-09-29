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
  QueryParams,
  RequestOptions,
  Serialized,
} from '@sebspark/openapi-core'
import type { Request as ExpressRequest } from 'express'

type Req = Pick<ExpressRequest, 'url' | 'baseUrl' | 'cookies' | 'hostname'>

/* tslint:disable */
/* eslint-disable */

/**
 * Card
 */
export type Card = {
  id: string
  ownerId: string
  'name-on-card': string
  'settings/foo'?: CardSettings
}

/**
 * CardSettings
 */
export type CardSettings = {
  cardId: string
  frozen: {
    value: boolean
    editableByChild: boolean
  }
}

/**
 * AccountBalance
 */
export type CardList = {
  cards: Card[]
}

/**
 * A documented type
 */
export type Documented = {
  /**
   * The id of the documented type
   */
  id: string
  /**
   * Settings
   */
  settings?: CardSettings
}

/**
 * HttpError
 */
export type HttpError = {
  message: string
  stack?: string
}

export type CardsAPIServerPaths = {
  '/': {
    get: {
      /**
       *
       * @param {Object} [args] - Optional. The arguments for the request.
       * @param {Object} [args.query] - Optional. Query parameters for the request.
       * @param {number} [args.query.page] - Optional.
       * @param {number} [args.query.limit] - Optional.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<CardList>>] | [401, APIResponse<PartiallySerialized<HttpError>>]>}
       */
      handler: (
        args?: Req & {
          query?: QueryParams<{
            page?: number
            limit?: number
          }>
        }
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<CardList>>]
        | [401, APIResponse<PartiallySerialized<HttpError>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/:cardId': {
    delete: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.cardId
       * @param {Object} args.query - Query parameters for the request.
       * @param {boolean} args.query.cardNickname
       * @returns {Promise<[200, APIResponse<PartiallySerialized<Card>>]>}
       */
      handler: (
        args: Req & {
          params: {
            cardId: string
          }
          query: QueryParams<{
            cardNickname: boolean
          }>
        }
      ) => Promise<[200, APIResponse<PartiallySerialized<Card>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.cardId
       * @param {Object} args.query - Query parameters for the request.
       * @param {boolean} args.query.cardNickname
       * @param {Object} args.headers - Headers for the request.
       * @param {string} args.headers["X-User-Id"]
       * @param {string} [args.headers["X-Distributor-Id"]] - Optional.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<Card>>] | [401, APIResponse<PartiallySerialized<HttpError>>]>}
       */
      handler: (
        args: Req & {
          headers: LowerCaseHeaders<{
            'X-User-Id': string
            'X-Distributor-Id'?: string
          }>
          params: {
            cardId: string
          }
          query: QueryParams<{
            cardNickname: boolean
          }>
        }
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<Card>>]
        | [401, APIResponse<PartiallySerialized<HttpError>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/:cardId/settings': {
    put: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.cardId
       * @param {Object} args.headers - Headers for the request.
       * @param {string} args.headers["x-forwarded-authorization"]
       * @param {CardSettings} [args.body] - Optional. Request body for the request.
       * @returns {Promise<[204, undefined]>}
       */
      handler: (
        args: Req & {
          body?: CardSettings
          headers: LowerCaseHeaders<{
            'x-forwarded-authorization': string
          }>
          params: {
            cardId: string
          }
        }
      ) => Promise<[204, undefined]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

export type CardsAPIServer = APIServerDefinition & CardsAPIServerPaths

export type CardsAPIClient = Pick<BaseClient, 'get' | 'delete' | 'put'> & {
  get: {
    /**
     *
     * @param {string} url
     * @param {Object} [args] - Optional. The arguments for the request.
     * @param {Object} [args.query] - Optional. Query parameters for the request.
     * @param {number} [args.query.page] - Optional.
     * @param {number} [args.query.limit] - Optional.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<CardList>>>}
     */
    (
      url: '/',
      args?: {
        query?: {
          page?: number
          limit?: number
        }
      },
      opts?: RequestOptions
    ): Promise<APIResponse<Serialized<CardList>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.cardId
     * @param {Object} args.query - Query parameters for the request.
     * @param {boolean} args.query.cardNickname
     * @param {Object} args.headers - Headers for the request.
     * @param {string} args.headers["X-User-Id"]
     * @param {string} [args.headers["X-Distributor-Id"]] - Optional.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<Card>>>}
     */
    (
      url: '/:cardId',
      args: {
        headers: {
          'X-User-Id': string
          'X-Distributor-Id'?: string
        }
        params: {
          cardId: string
        }
        query: {
          cardNickname: boolean
        }
      },
      opts?: RequestOptions
    ): Promise<APIResponse<Serialized<Card>>>
  }
  delete: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.cardId
     * @param {Object} args.query - Query parameters for the request.
     * @param {boolean} args.query.cardNickname
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<Card>>>}
     */
    (
      url: '/:cardId',
      args: {
        params: {
          cardId: string
        }
        query: {
          cardNickname: boolean
        }
      },
      opts?: RequestOptions
    ): Promise<APIResponse<Serialized<Card>>>
  }
  put: {
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.cardId
     * @param {Object} args.headers - Headers for the request.
     * @param {string} args.headers["x-forwarded-authorization"]
     * @param {CardSettings} [args.body] - Optional. Request body for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<undefined>}
     */
    (
      url: '/:cardId/settings',
      args: {
        body?: CardSettings
        headers: {
          'x-forwarded-authorization': string
        }
        params: {
          cardId: string
        }
      },
      opts?: RequestOptions
    ): Promise<undefined>
  }
}
