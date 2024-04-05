import { describe, it, expect } from 'vitest'
import { calculatePL } from './pl'
import type { PerformanceCalculationInput } from './types'

describe('P/L Calculations', () => {
  // Testing the calculatePL function for accuracy
  it('calculatePL calculates the profit/loss for both total and without_cash correctly', () => {
    const data: PerformanceCalculationInput = {
      initialValue: { total: 1000, without_cash: 950 },
      endingValue: { total: 1210, without_cash: 1155 },
      cashFlows: [
        { date: '2023-02-01', amount: 50, investment_related: true }, // Additional investment
        { date: '2023-03-01', amount: -10, investment_related: false }, // Non-investment cash flow (e.g., fee)
      ],
      transactions: [],
      periodicValues: [], // Not required for P/L calculation
      startDate: '2023-01-01',
      endDate: '2023-04-01',
    }
    const expectedTotalPL = 160 // Ending total - Initial total - Investment cash flows
    const expectedWithoutCashPL = 205 // Ending without cash - Initial without cash (no cash flow adjustment)

    const result = calculatePL(data)
    expect(result.total).toBeCloseTo(expectedTotalPL)
    expect(result.without_cash).toBeCloseTo(expectedWithoutCashPL)
  })

  // Additional tests could include scenarios with no profit/loss, negative profit/loss, and varying cash flows
})
