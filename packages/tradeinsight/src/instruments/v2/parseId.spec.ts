import { describe, expect, it } from 'vitest'
import {
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
} from '../types'
import {
  createBondExchangeId,
  createBondOTCId,
  createDerivativeId,
  createETFId,
  createETPId,
  createForexId,
  createFundId,
  createIndexId,
  createStockId,
} from './createId'
import { parseId } from './parseId'

describe('parseId', () => {
  describe('BNE', () => {
    let result: TradeInsightId | undefined
    const id = 'BNE_SE0015501123_SSMA_SEK'
    it('should parse a valid BNE id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'BNE',
        isin: 'SE0015501123',
        mic: 'SSMA',
        currency: 'SEK',
      })
    })

    it('should throw an error if isin is missing', () => {
      expect(() => parseId('BNE')).toThrowError('Missing isin')
    })
    it('should throw an error if mic is missing', () => {
      expect(() => parseId('BNE_SE0015501123')).toThrowError('Missing mic')
    })
    it('should throw an error if currency is missing', () => {
      expect(() => parseId('BNE_SE0015501123_SSMA')).toThrowError(
        'Missing currency'
      )
    })
    it('should create new to same id', () => {
      const newId = createBondExchangeId(result as BondExchangeId)
      expect(newId).toEqual(id)
    })
  })

  describe('BND', () => {
    let result: TradeInsightId | undefined
    const id = 'BND_SE0098765432_SEK'
    it('should parse a valid BND id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'BND',
        isin: 'SE0098765432',
        currency: 'SEK',
      })
    })

    it('should throw an error if isin is missing', () => {
      expect(() => parseId('BND')).toThrowError('Missing isin')
    })
    it('should throw an error if currency is missing', () => {
      expect(() => parseId('BND_SE0098765432')).toThrowError('Missing currency')
    })
    it('should create new to same id', () => {
      const newId = createBondOTCId(result as BondOTCId)
      expect(newId).toEqual(id)
    })
  })

  describe('DER', () => {
    let result: TradeInsightId | undefined
    const id = 'DER_AAPL_XNAS_USD_170_20260320'
    it('should parse a valid DER id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'DER',
        ticker: 'AAPL',
        mic: 'XNAS',
        currency: 'USD',
        strike: '170',
        expiry: '20260320',
      })
    })

    it('should throw an error if ticker is missing', () => {
      expect(() => parseId('DER')).toThrowError('Missing ticker')
    })
    it('should throw an error if mic is missing', () => {
      expect(() => parseId('DER_AAPL')).toThrowError('Missing mic')
    })
    it('should throw an error if currency is missing', () => {
      expect(() => parseId('DER_AAPL_XNAS')).toThrowError('Missing currency')
    })
    it('should throw an error if strike is missing', () => {
      expect(() => parseId('DER_AAPL_XNAS_USD')).toThrowError('Missing strike')
    })
    it('should throw an error if expiry is missing', () => {
      expect(() => parseId('DER_AAPL_XNAS_USD_170')).toThrowError(
        'Missing expiry'
      )
    })
    it('should create new to same id', () => {
      const newId = createDerivativeId(result as DerivativeId)
      expect(newId).toEqual(id)
    })
  })

  describe('ETF', () => {
    let result: TradeInsightId | undefined
    const id = 'ETF_SE0000693571_XSTO_SEK'
    it('should parse a valid ETF id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'ETF',
        isin: 'SE0000693571',
        mic: 'XSTO',
        currency: 'SEK',
      })
    })

    it('should throw an error if isin is missing', () => {
      expect(() => parseId('ETF')).toThrowError('Missing isin')
    })
    it('should throw an error if mic is missing', () => {
      expect(() => parseId('ETF_SE0000693571')).toThrowError('Missing mic')
    })
    it('should throw an error if currency is missing', () => {
      expect(() => parseId('ETF_SE0000693571_XSTO')).toThrowError(
        'Missing currency'
      )
    })
    it('should create new to same id', () => {
      const newId = createETFId(result as ETFId)
      expect(newId).toEqual(id)
    })
  })

  describe('ETP', () => {
    let result: TradeInsightId | undefined
    const id = 'ETP_SE0015551111_XSTO_SEK'
    it('should parse a valid ETP id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'ETP',
        isin: 'SE0015551111',
        mic: 'XSTO',
        currency: 'SEK',
      })
    })

    it('should throw an error if isin is missing', () => {
      expect(() => parseId('ETP')).toThrowError('Missing isin')
    })
    it('should throw an error if mic is missing', () => {
      expect(() => parseId('ETP_SE0015551111')).toThrowError('Missing mic')
    })
    it('should throw an error if currency is missing', () => {
      expect(() => parseId('ETP_SE0015551111_XSTO')).toThrowError(
        'Missing currency'
      )
    })
    it('should create new to same id', () => {
      const newId = createETPId(result as ETPId)
      expect(newId).toEqual(id)
    })
  })

  describe('FND', () => {
    let result: TradeInsightId | undefined
    const id = 'FND_SE0011527613_EUR'
    it('should parse a valid FND id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'FND',
        isin: 'SE0011527613',
        currency: 'EUR',
      })
    })

    it('should throw an error if isin is missing', () => {
      expect(() => parseId('FND')).toThrowError('Missing isin')
    })
    it('should throw an error if currency is missing', () => {
      expect(() => parseId('FND_SE0011527613')).toThrowError('Missing currency')
    })
    it('should create new to same id', () => {
      const newId = createFundId(result as FundId)
      expect(newId).toEqual(id)
    })
  })

  describe('IDX', () => {
    let result: TradeInsightId | undefined
    const id = 'IDX_OMXS30_SEK'
    it('should parse a valid IDX id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'IDX',
        ticker: 'OMXS30',
        currency: 'SEK',
      })
    })

    it('should throw an error if ticker is missing', () => {
      expect(() => parseId('IDX')).toThrowError('Missing ticker')
    })
    it('should throw an error if currency is missing', () => {
      expect(() => parseId('IDX_OMXS30')).toThrowError('Missing currency')
    })
    it('should create new to same id', () => {
      const newId = createIndexId(result as IndexId)
      expect(newId).toEqual(id)
    })
  })

  describe('FXS', () => {
    let result: TradeInsightId | undefined
    const id = 'FXS_USD_SEK'
    it('should parse a valid FXS id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'FXS',
        baseCurrency: 'USD',
        quoteCurrency: 'SEK',
      })
    })

    it('should throw an error if baseCurrency is missing', () => {
      expect(() => parseId('FXS')).toThrowError('Missing baseCurrency')
    })
    it('should throw an error if quoteCurrency is missing', () => {
      expect(() => parseId('FXS_USD')).toThrowError('Missing quoteCurrency')
    })
    it('should create new to same id', () => {
      const newId = createForexId(result as ForexId)
      expect(newId).toEqual(id)
    })
  })

  describe('STO', () => {
    let result: TradeInsightId | undefined
    const id = 'STO_SE0000695874_XSTO_SEK'
    it('should parse a valid STO id', () => {
      result = parseId(id)

      expect(result).toEqual({
        type: 'STO',
        isin: 'SE0000695874',
        currency: 'SEK',
        mic: 'XSTO',
      })
    })

    it('should throw an error if isin is missing', () => {
      expect(() => parseId('STO')).toThrowError('Missing isin')
    })
    it('should throw an error if mic is missing', () => {
      expect(() => parseId('STO_SE0000695874')).toThrowError('Missing mic')
    })
    it('should throw an error if currency is missing', () => {
      expect(() => parseId('STO_SE0000695874_XSTO')).toThrowError(
        'Missing currency'
      )
    })
    it('should create new to same id', () => {
      const newId = createStockId(result as StockId)
      expect(newId).toEqual(id)
    })
  })
})
