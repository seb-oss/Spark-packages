import {
  ForbiddenError,
  InternalServerError,
  NotImplementedError,
  type PartiallySerialized,
  UnauthorizedError,
} from '@sebspark/openapi-core'
import { TypedRouter } from '@sebspark/openapi-express'
import express from 'express'
import type {
  InstrumentEntityResponse,
  MarketdataServer,
  MarketListResponse,
} from './schemas/marketdata'

export const markets: MarketListResponse = {
  data: [
    {
      data: { id: 'se', name: 'Nasdaq STHLM' },
      links: { self: '/markets/se' },
    },
  ],
  links: {
    self: '/markets',
  },
}

const api: MarketdataServer = {
  '/secured': {
    get: {
      handler: async ({ headers }) => {
        if (!headers['x-client-key']) throw new UnauthorizedError()
        if (!headers['x-api-key']) throw new ForbiddenError()
        return [200, { data: 'ok' }]
      },
    },
  },
  '/header/extract': {
    get: {
      handler: async ({ headers }) => {
        if (!headers['x-test-value']) throw new InternalServerError()
        return [200, { data: headers['x-test-value'] }]
      },
    },
  },
  '/instruments/:isin': {
    get: {
      handler: async (args) => {
        throw new NotImplementedError()
      },
    },
  },
  '/markets': {
    get: {
      handler: async () => {
        return [200, { data: markets }]
      },
    },
  },
  '/markets/:mic': {
    get: {
      handler: async (args) => {
        throw new NotImplementedError()
      },
    },
  },
  '/markets/:mic/instruments': {
    get: {
      handler: async () => {
        throw new NotImplementedError()
      },
    },
  },
  '/markets/:mic/instruments/:isin/:currency': {
    get: {
      handler: async ({ params: { currency, isin, mic } }) => {
        const instrument: PartiallySerialized<InstrumentEntityResponse> = {
          data: {
            id: `${mic.toLowerCase()}_${isin.toLowerCase()}_${currency.toLowerCase()}`,
            currency,
            mic,
            isin,
            lastValidDate: '2024-02-05',
            lastValidDateTime: '2024-02-05T13:05:02.000Z',
          },
          links: {
            self: `/markets/${mic}/instruments/${isin}/${currency}`.toLowerCase(),
          },
        }
        return [200, { data: instrument }]
      },
    },
  },
} as MarketdataServer

const router = TypedRouter(api)

const app = express()
app.use(router)

export { app }
