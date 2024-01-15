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

export type MarketListItem = {
  id: string
  name: string
}

export type Market = MarketListItem & {
  service: string
  provider: string
  access: string
  feed: number
  mic: string
  min_delay_secs: number
  max_delay_secs: number
  country: number
  data_types: string[]
}

export type MarketListResponse = {
  data: object[]
  links: PaginationLinks
  meta?: PaginationMeta
}

export type MarketEntityResponse = {
  data: Market
  links: SelfLink
}

export type InstrumentListItem = {
  id?: string
  type?: string
  feed?: number
  ticker?: string
  isin?: string
  currency?: string
  instrument_type?: string
  instrument_subtype?: string
  full_name?: string
  feed_code?: string
  mic?: string
  links?: {
    self?: string
    related?: string[]
  }
}

export type Instrument = InstrumentListItem

export type InstrumentListResponse = {
  data: object[]
  links: PaginationLinks
  meta?: PaginationMeta
}

export type InstrumentEntityResponse = {
  data: Instrument
  links: SelfLink
}

export type SelfLink = {
  self: string
}

export type PaginationLinks = {
  self: string
  next?: string
  prev?: string
  last?: string
  first?: string
}

export type PaginationMeta = {
  totalItems?: number
  itemsPerPage?: number
  totalPages?: number
  currentPage?: number
}

export type Error = {
  code: number
  message: string
}

/**
 * Unauthorized
 */
export type Unauthorized = APIResponse<Error>

/**
 * Forbidden
 */
export type Forbidden = APIResponse<Error>

/**
 * Not Found
 */
export type NotFound = APIResponse<Error>

/**
 * Internal Server Error
 */
export type InternalServerError = APIResponse<Error>

export type MarketdataServer = APIServerDefinition & {
  '/markets': {
    get: {
      /**
       *
       * @param {Object} [args] - Optional. The arguments for the request.
       * @param {Object} [args.query] - Optional. Query parameters for the request.
       * @param {number} [args.query.page] - Optional.
       * @param {number} [args.query.limit] - Optional.
       * @returns {Promise<[200, APIResponse<MarketListResponse>]>}
       */
      handler: (
        args?: Req & {
          query?: {
            page?: number
            limit?: number
          }
        },
      ) => Promise<[200, APIResponse<MarketListResponse>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/markets/:mic': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.mic
       * @returns {Promise<[200, APIResponse<MarketEntityResponse>]>}
       */
      handler: (
        args: Req & {
          params: {
            mic: string
          }
        },
      ) => Promise<[200, APIResponse<MarketEntityResponse>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/markets/:mic/instruments': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.mic
       * @param {Object} [args.query] - Optional. Query parameters for the request.
       * @param {array} [args.query.data_types] - Optional.
       * @returns {Promise<[200, APIResponse<InstrumentListResponse>]>}
       */
      handler: (
        args: Req & {
          params: {
            mic: string
          }
          query?: {
            data_types?: string[]
          }
        },
      ) => Promise<[200, APIResponse<InstrumentListResponse>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/markets/:mic/instruments/:isin/:currency': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.mic
       * @param {string} args.params.isin
       * @param {string} args.params.currency
       * @returns {Promise<[200, APIResponse<InstrumentEntityResponse>]>}
       */
      handler: (
        args: Req & {
          params: {
            mic: string
            isin: string
            currency: string
          }
        },
      ) => Promise<[200, APIResponse<InstrumentEntityResponse>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:isin': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.isin
       * @returns {Promise<[200, APIResponse<InstrumentListResponse>]>}
       */
      handler: (
        args: Req & {
          params: {
            isin: string
          }
        },
      ) => Promise<[200, APIResponse<InstrumentListResponse>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

export type MarketdataClient = Pick<BaseClient, 'get'> & {
  get: {
    /**
     *
     * @param {string} url
     * @param {Object} [args] - Optional. The arguments for the request.
     * @param {Object} [args.query] - Optional. Query parameters for the request.
     * @param {number} [args.query.page] - Optional.
     * @param {number} [args.query.limit] - Optional.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<MarketListResponse>>}
     */
    (
      url: '/markets',
      args?: {
        query?: {
          page?: number
          limit?: number
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<MarketListResponse>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.mic
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<MarketEntityResponse>>}
     */
    (
      url: '/markets/:mic',
      args: {
        params: {
          mic: string
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<MarketEntityResponse>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.mic
     * @param {Object} [args.query] - Optional. Query parameters for the request.
     * @param {array} [args.query.data_types] - Optional.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<InstrumentListResponse>>}
     */
    (
      url: '/markets/:mic/instruments',
      args: {
        params: {
          mic: string
        }
        query?: {
          data_types?: string[]
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<InstrumentListResponse>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.mic
     * @param {string} args.params.isin
     * @param {string} args.params.currency
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<InstrumentEntityResponse>>}
     */
    (
      url: '/markets/:mic/instruments/:isin/:currency',
      args: {
        params: {
          mic: string
          isin: string
          currency: string
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<InstrumentEntityResponse>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.isin
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<InstrumentListResponse>>}
     */
    (
      url: '/instruments/:isin',
      args: {
        params: {
          isin: string
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<InstrumentListResponse>>
  }
}
