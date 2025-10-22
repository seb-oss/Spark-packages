import { describe, expect, it } from 'vitest'
import { parseId } from './parseId'

describe('parseId', () => {
  describe('FOREX', () => {
    it('should parse a valid FOREX id', () => {
      const result = parseId('FOREX-USD;EUR')

      expect(result).toEqual({
        type: 'FOREX',
        baseCurrency: 'USD',
        quoteCurrency: 'EUR',
      })
    })

    it('should throw an error if baseCurrency is missing', () => {
      expect(() => parseId('FOREX-;EUR')).toThrowError('Missing baseCurrency')
    })

    it('should throw an error if quoteCurrency is missing', () => {
      expect(() => parseId('FOREX-USD;')).toThrowError('Missing quoteCurrency')
    })
  })

  describe('STOCK', () => {
    it('should parse a valid STOCK id', () => {
      expect(parseId('STOCK-SE0000108656;XSTO;SEK')).toEqual({
        type: 'STOCK',
        isin: 'SE0000108656',
        mic: 'XSTO',
        currency: 'SEK',
      })
      expect(parseId('STOCK-FI0009000681;XHEL;EUR')).toEqual({
        type: 'STOCK',
        isin: 'FI0009000681',
        mic: 'XHEL',
        currency: 'EUR',
      })
    })

    it('should throw an error if MIC is missing', () => {
      expect(() => parseId('STOCK-SE0000108656;;SEK')).toThrowError(
        'Missing MIC'
      )
    })

    it('should throw an error if currency is missing', () => {
      expect(() => parseId('STOCK-SE0000108656;XSTO')).toThrowError(
        'Missing currency'
      )
      expect(() => parseId('STOCK-SE0000108656;XSTO;')).toThrowError(
        'Missing currency'
      )
    })
  })
})
