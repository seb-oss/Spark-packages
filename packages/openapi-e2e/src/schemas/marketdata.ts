/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

import {
  APIServerDefinition,
  BaseClient,
  GenericRouteHandler,
} from '@sebspark/openapi-core'

/* tslint:disable */
/* eslint-disable */

export type MarketListItem = { id: string; name: string }

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
  data: { data?: MarketListItem; links?: SelfLink }[]
  links: PaginationLinks
  meta?: PaginationMeta
}

export type MarketEntityResponse = { data: Market; links: SelfLink }

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
  links?: { self?: string; related?: string[] }
}

export type Instrument = InstrumentListItem

export type InstrumentListResponse = {
  data: { data?: InstrumentListItem; links?: SelfLink }[]
  links: PaginationLinks
  meta?: PaginationMeta
}

export type InstrumentEntityResponse = { data: Instrument; links: SelfLink }

export type SelfLink = { self: string }

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

export type Error = { code: number; message: string }

export type MarketdataAPIServer = APIServerDefinition & {
  '/markets': {
    get: {
      handler: (args: {
        query: { page?: number; limit?: number }
      }) => Promise<[200, MarketListResponse]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/markets/:mic': {
    get: {
      handler: (args: {
        params: { mic: string }
      }) => Promise<[200, MarketEntityResponse]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/markets/:mic/instruments': {
    get: {
      handler: (args: {
        params: { mic: string }
        query: { data_types?: ('INDICIES' | 'STOCKS' | 'FUNDS')[] }
      }) => Promise<[200, InstrumentListResponse]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/markets/:mic/instruments/:isin/:currency': {
    get: {
      handler: (args: {
        params: { mic: string; isin: string; currency: string }
      }) => Promise<[200, InstrumentEntityResponse]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:isin': {
    get: {
      handler: (args: {
        params: { isin: string }
      }) => Promise<[200, InstrumentListResponse]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

type MarketdataAPIClientGet = {
  (
    url: '/markets',
    args: { query: { page?: number; limit?: number } },
  ): Promise<MarketListResponse>

  (
    url: '/markets/:mic',
    args: { params: { mic: string } },
  ): Promise<MarketEntityResponse>

  (
    url: '/markets/:mic/instruments',
    args: {
      params: { mic: string }
      query: { data_types?: ('INDICIES' | 'STOCKS' | 'FUNDS')[] }
    },
  ): Promise<InstrumentListResponse>

  (
    url: '/markets/:mic/instruments/:isin/:currency',
    args: { params: { mic: string; isin: string; currency: string } },
  ): Promise<InstrumentEntityResponse>

  (
    url: '/instruments/:isin',
    args: { params: { isin: string } },
  ): Promise<InstrumentListResponse>
}

export type MarketdataAPIClient = BaseClient & {
  get: MarketdataAPIClientGet
}
