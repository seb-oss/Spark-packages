import type { PerformanceCalculationInput, PortfolioValue } from './types'
import BigNumber from 'bignumber.js'
import { differenceInCalendarDays, parseISO } from 'date-fns'

export const calculateCAGR = (
  initialValue: BigNumber,
  finalValue: BigNumber,
  startDate: string,
  endDate: string
): BigNumber => {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const daysDiff = differenceInCalendarDays(end, start)
  const years = new BigNumber(daysDiff).dividedBy(365) // Approximate years

  if (years.isZero()) return new BigNumber(0) // Prevent division by zero in CAGR formula

  // CAGR formula: [(Ending value / Beginning value) ^ (1 / Number of years)] - 1
  return finalValue
    .dividedBy(initialValue)
    .pow(years.pow(-1).integerValue())
    .minus(1)
}

export const calculatePortfolioCAGR = (
  data: PerformanceCalculationInput
): PortfolioValue => {
  const initialTotal = new BigNumber(data.initialValue.total)
  const finalTotal = new BigNumber(data.endingValue.total)
  const initialWithoutCash = new BigNumber(data.initialValue.without_cash)
  const finalWithoutCash = new BigNumber(data.endingValue.without_cash)

  const totalCAGR = calculateCAGR(
    initialTotal,
    finalTotal,
    data.startDate,
    data.endDate
  )
  const withoutCashCAGR = calculateCAGR(
    initialWithoutCash,
    finalWithoutCash,
    data.startDate,
    data.endDate
  )

  return {
    total: totalCAGR.toNumber(),
    without_cash: withoutCashCAGR.toNumber(),
  }
}
