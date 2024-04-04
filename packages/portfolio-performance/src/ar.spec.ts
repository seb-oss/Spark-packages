import { describe, it, expect } from 'vitest'
import { calculatePeriodicReturns, calculateAverage, calculateAR } from './ar'
import type { PerformanceCalculationInput } from './types'
import BigNumber from 'bignumber.js'

describe('AR Calculations', () => {
  // Testing calculatePeriodicReturns function
  it('calculatePeriodicReturns calculates the returns for each period correctly', () => {
    const periodicValues = [
      { date: '2023-01-01', total: 100, without_cash: 100 },
      { date: '2023-02-01', total: 110, without_cash: 110 },
      { date: '2023-03-01', total: 121, without_cash: 121 },
    ]
    const expected = [0.1, 0.1] // 10% return for each period
    const returns = calculatePeriodicReturns(periodicValues)
    expect(returns.map((r) => r.toNumber())).toEqual(expected)
  })

  // Testing calculateAverage function
  it('calculateAverage calculates the average return correctly', () => {
    const returns = [
      new BigNumber(0.1),
      new BigNumber(0.2),
      new BigNumber(0.15),
    ]
    const expected = 0.15 // Average of the returns
    const average = calculateAverage(returns)
    expect(average.toNumber()).toBe(expected)
  })

  // Testing calculateAR function
  it('calculateAR calculates the average return (AR) for both total and without_cash correctly', () => {
    const data: PerformanceCalculationInput = {
      initialValue: { total: 100, without_cash: 100 },
      endingValue: { total: 121, without_cash: 121 },
      cashFlows: [{ date: '2023-01-15', amount: 10, investment_related: true }],
      transactions: [],
      periodicValues: [
        { date: '2023-01-01', total: 100, without_cash: 100 },
        { date: '2023-02-01', total: 110, without_cash: 110 },
        { date: '2023-03-01', total: 121, without_cash: 121 },
      ],
      startDate: '2023-01-01',
      endDate: '2023-03-01',
    }
    const expected = {
      total: 0.1, // Average return across periods
      without_cash: 0.1, // Same as total since cash does not change the calculation
    }
    const result = calculateAR(data)
    expect(result.total).toBeCloseTo(expected.total)
    expect(result.without_cash).toBeCloseTo(expected.without_cash)
  })
})
