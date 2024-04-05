import { describe, it, expect } from 'vitest'
import { calculateCAGR, calculatePortfolioCAGR } from './cagr'
import type { PerformanceCalculationInput } from './types'
import BigNumber from 'bignumber.js'

describe('CAGR Calculations', () => {
  // Testing the calculateCAGR helper function
  it('calculateCAGR calculates the compound annual growth rate correctly', () => {
    // Assume a period of one year for simplicity
    const initialValue = new BigNumber(100)
    const finalValue = new BigNumber(110)
    const startDate = '2023-01-01'
    const endDate = '2024-01-01'
    const expectedCAGR = 0.1 // Expected CAGR is 10%

    const cagr = calculateCAGR(initialValue, finalValue, startDate, endDate)
    expect(cagr.toNumber()).toBeCloseTo(expectedCAGR)
  })

  // Testing the calculatePortfolioCAGR main function
  it('calculatePortfolioCAGR calculates the CAGR for both total and without_cash correctly', () => {
    const data: PerformanceCalculationInput = {
      initialValue: { total: 100, without_cash: 90 },
      endingValue: { total: 121, without_cash: 108.9 },
      cashFlows: [{ date: '2023-06-01', amount: 10, investment_related: true }],
      transactions: [],
      periodicValues: [], // Not needed for CAGR calculation
      startDate: '2023-01-01',
      endDate: '2024-01-01',
    }
    const expectedTotalCAGR = 0.21 // 21% CAGR for total
    const expectedWithoutCashCAGR = 0.21 // 21% CAGR for without cash as well

    const result = calculatePortfolioCAGR(data)
    expect(result.total).toBeCloseTo(expectedTotalCAGR)
    expect(result.without_cash).toBeCloseTo(expectedWithoutCashCAGR)
  })
})
