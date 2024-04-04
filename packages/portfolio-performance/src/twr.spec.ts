import { describe, it, expect } from 'vitest'
import { calculateSubPeriodReturn, compoundReturns, calculateTWR } from './twr'
import type { PerformanceCalculationInput } from './types'
import BigNumber from 'bignumber.js'

describe('TWR Calculations', () => {
  // Testing calculateSubPeriodReturn function
  it('calculateSubPeriodReturn calculates the return for a single period correctly', () => {
    const beginValue = new BigNumber(1000)
    const endValue = new BigNumber(1100)
    const cashFlow = new BigNumber(100) // Assuming a cash flow occurred during the period
    const expectedReturn = 0 // (1100 - 100) / 1000 - 1 = 0
    const result = calculateSubPeriodReturn(beginValue, endValue, cashFlow)
    expect(result.toNumber()).toBeCloseTo(expectedReturn)
  })

  // Testing compoundReturns function
  it('compoundReturns accurately compounds multiple periods of returns', () => {
    const returns = [
      new BigNumber(0.1),
      new BigNumber(0.2),
      new BigNumber(-0.05),
    ] // Example returns for three periods
    const expectedCompoundedReturn = new BigNumber(1.1)
      .multipliedBy(1.2)
      .multipliedBy(0.95)
      .minus(1)
    const result = compoundReturns(returns)
    expect(result.toNumber()).toBeCloseTo(expectedCompoundedReturn.toNumber())
  })

  // Testing calculateTWR main function
  it('calculateTWR calculates the time-weighted return for the entire portfolio correctly', () => {
    const data: PerformanceCalculationInput = {
      initialValue: { total: 1000, without_cash: 1000 },
      endingValue: { total: 1210, without_cash: 1210 },
      cashFlows: [
        { date: '2023-02-01', amount: 100, investment_related: true },
        { date: '2023-03-01', amount: 100, investment_related: true },
      ],
      transactions: [],
      periodicValues: [
        { date: '2023-01-01', total: 1000, without_cash: 1000 },
        { date: '2023-02-01', total: 1100, without_cash: 1100 },
        { date: '2023-03-01', total: 1200, without_cash: 1200 },
        { date: '2023-04-01', total: 1210, without_cash: 1210 },
      ],
      startDate: '2023-01-01',
      endDate: '2023-04-01',
    }
    // The expected TWR would need to be calculated based on the input data.
    const expectedTotal = 0.0175
    const expectedWithoutCash = 0.21

    const result = calculateTWR(data)
    expect(result.total).toBeCloseTo(expectedTotal)
    expect(result.without_cash).toBeCloseTo(expectedWithoutCash)
  })
})
