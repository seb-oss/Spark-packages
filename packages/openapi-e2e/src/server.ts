import { NotImplementedError } from '@sebspark/openapi-core'
import { TypedRouter } from '@sebspark/openapi-express'
import express from 'express'
import {
  InstrumentEntityResponse,
  MarketListResponse,
  MarketdataServer,
} from './schemas/Marketdata'

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
      handler: async (args) => {
        throw new NotImplementedError()
      },
    },
  },
  '/markets/:mic/instruments/:isin/:currency': {
    get: {
      handler: async ({ params: { currency, isin, mic } }) => {
        const instrument: InstrumentEntityResponse = {
          data: {
            id: `${mic.toLowerCase()}_${isin.toLowerCase()}_${currency.toLowerCase()}`,
            currency,
            mic,
            isin,
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
