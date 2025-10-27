import { describe, expect, it } from 'vitest'
import { parseId } from './parseId'

describe('parseId', () => {
  describe('INDEX', () => {
    it('should parse a valid INDEX id', () => {
      const result = parseId('INDEX-OMXS30')

      expect(result).toEqual({
        type: 'INDEX',
        ticker: 'OMXS30',
      })
    })

    it('should throw an error if ticker is missing', () => {
      expect(() => parseId('INDEX-')).toThrowError('Missing ticker')
    })
  })

  describe('FOREX', () => {
    it('should parse a valid FOREX id', () => {
      const result = parseId('FOREX-USD_EUR')

      expect(result).toEqual({
        type: 'FOREX',
        baseCurrency: 'USD',
        quoteCurrency: 'EUR',
      })
    })

    it('should throw an error if baseCurrency is missing', () => {
      expect(() => parseId('FOREX-_EUR')).toThrowError('Missing baseCurrency')
    })

    it('should throw an error if quoteCurrency is missing', () => {
      expect(() => parseId('FOREX-USD_')).toThrowError('Missing quoteCurrency')
    })
  })

  describe('STOCK', () => {
    it('should parse a valid STOCK id', () => {
      expect(parseId('STOCK-SE0000108656_XSTO_SEK')).toEqual({
        type: 'STOCK',
        isin: 'SE0000108656',
        mic: 'XSTO',
        currency: 'SEK',
      })
      expect(parseId('STOCK-FI0009000681_XHEL_EUR')).toEqual({
        type: 'STOCK',
        isin: 'FI0009000681',
        mic: 'XHEL',
        currency: 'EUR',
      })
    })

    it('should throw an error if MIC is missing', () => {
      expect(() => parseId('STOCK-SE0000108656__SEK')).toThrowError(
        'Missing MIC'
      )
    })

    it('should throw an error if currency is missing', () => {
      expect(() => parseId('STOCK-SE0000108656_XSTO')).toThrowError(
        'Missing currency'
      )
      expect(() => parseId('STOCK-SE0000108656_XSTO_')).toThrowError(
        'Missing currency'
      )
    })
  })
})
