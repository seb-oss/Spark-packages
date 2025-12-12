import type {
  BondExchangeId,
  BondOTCId,
  DerivativeId,
  ETFId,
  ETPId,
  ForexId,
  FundId,
  IndexId,
  StockId,
  TradeInsightId,
  types,
} from '../types'

export const parseId = (id: string): TradeInsightId => {
  const [initial, first, second, third, fourth, fifth] = id.split('_')
  const type = initial as keyof typeof types

  switch (type) {
    case 'BNE':
      if (!first) {
        throw new Error('Missing isin')
      }
      if (!second) {
        throw new Error('Missing mic')
      }
      if (!third) {
        throw new Error('Missing currency')
      }
      return {
        type: 'BNE',
        isin: first,
        mic: second,
        currency: third,
      } satisfies BondExchangeId as BondExchangeId

    case 'BND':
      if (!first) {
        throw new Error('Missing isin')
      }
      if (!second) {
        throw new Error('Missing currency')
      }
      return {
        type: 'BND',
        isin: first,
        currency: second,
      } satisfies BondOTCId as BondOTCId

    case 'DER': {
      if (!first) {
        throw new Error('Missing ticker')
      }
      if (!second) {
        throw new Error('Missing mic')
      }
      if (!third) {
        throw new Error('Missing currency')
      }
      if (!fourth) {
        throw new Error('Missing strike')
      }
      if (!fifth) {
        throw new Error('Missing expiry')
      }
      return {
        type: 'DER',
        ticker: first,
        mic: second,
        currency: third,
        strike: fourth,
        expiry: fifth,
      } satisfies DerivativeId as DerivativeId
    }

    case 'ETF': {
      if (!first) {
        throw new Error('Missing isin')
      }
      if (!second) {
        throw new Error('Missing mic')
      }
      if (!third) {
        throw new Error('Missing currency')
      }
      return {
        type: 'ETF',
        isin: first,
        mic: second,
        currency: third,
      } satisfies ETFId as ETFId
    }

    case 'ETP': {
      if (!first) {
        throw new Error('Missing isin')
      }
      if (!second) {
        throw new Error('Missing mic')
      }
      if (!third) {
        throw new Error('Missing currency')
      }
      return {
        type: 'ETP',
        isin: first,
        mic: second,
        currency: third,
      } satisfies ETPId as ETPId
    }

    case 'FXS': {
      if (!first) {
        throw new Error('Missing baseCurrency')
      }
      if (!second) {
        throw new Error('Missing quoteCurrency')
      }
      return {
        type: 'FXS',
        baseCurrency: first,
        quoteCurrency: second,
      } satisfies ForexId as ForexId
    }

    case 'FND': {
      if (!first) {
        throw new Error('Missing isin')
      }
      if (!second) {
        throw new Error('Missing currency')
      }
      return {
        type: 'FND',
        isin: first,
        currency: second,
      } satisfies FundId as FundId
    }

    case 'IDX': {
      if (!first) {
        throw new Error('Missing ticker')
      }
      if (!second) {
        throw new Error('Missing currency')
      }
      return {
        type: 'IDX',
        ticker: first,
        currency: second,
      } satisfies IndexId as IndexId
    }

    case 'STO': {
      if (!first) {
        throw new Error('Missing isin')
      }
      if (!second) {
        throw new Error('Missing mic')
      }
      if (!third) {
        throw new Error('Missing currency')
      }
      return {
        type: 'STO',
        isin: first,
        mic: second,
        currency: third,
      } satisfies StockId as StockId
    }

    default:
      throw new Error('Invalid type')
  }
}
