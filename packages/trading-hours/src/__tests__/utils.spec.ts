import { describe, expect, it } from 'vitest'
import { marketHalfdays, marketHoliday } from '../utils'

describe('marketHoliday', () => {
  it('returns empty array for XCSE in a year other than 2024', () => {
    expect(marketHoliday('XCSE', 2023)).toEqual([])
  })

  it('returns empty array for XLON in a year other than 2024', () => {
    expect(marketHoliday('XLON', 2023)).toEqual([])
  })

  it('returns empty array for unknown MIC', () => {
    expect(marketHoliday('XXXX', 2024)).toEqual([])
  })
})

describe('marketHalfdays', () => {
  it('returns empty array for MTAA in a year other than 2024', () => {
    expect(marketHalfdays('MTAA', 2023)).toEqual([])
  })

  it('returns empty array for unknown MIC', () => {
    expect(marketHalfdays('XXXX', 2024)).toEqual([])
  })
})
