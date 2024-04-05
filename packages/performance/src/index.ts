import type { PerformanceCalculationInput, PortfolioValue } from './types'
import { calculatePL } from './pl'
import { calculateTWR } from './twr'
import { calculatePortfolioCAGR } from './cagr'
import { calculateAR } from './ar'

type Performance = {
  PL: PortfolioValue
  TWR: PortfolioValue
  CAGR: PortfolioValue
  AR: PortfolioValue
}

export const calculatePerformance = (
  data: PerformanceCalculationInput
): Performance => {
  const PL = calculatePL(data)
  const TWR = calculateTWR(data)
  const CAGR = calculatePortfolioCAGR(data)
  const AR = calculateAR(data)

  return {
    PL,
    TWR,
    CAGR,
    AR,
  }
}
