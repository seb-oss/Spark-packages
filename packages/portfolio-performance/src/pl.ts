import type {
  CashFlow,
  PerformanceCalculationInput,
  PortfolioValue,
} from './types'
import BigNumber from 'bignumber.js'

export const calculateCashFlows = (cashFlows: CashFlow[]): BigNumber => {
  return cashFlows.reduce((acc, cf) => {
    return acc.plus(new BigNumber(cf.amount))
  }, new BigNumber(0))
}

export const calculatePL = (
  data: PerformanceCalculationInput
): PortfolioValue => {
  const initialValueTotal = new BigNumber(data.initialValue.total)
  const initialValueWithoutCash = new BigNumber(data.initialValue.without_cash)
  const endingValueTotal = new BigNumber(data.endingValue.total)
  const endingValueWithoutCash = new BigNumber(data.endingValue.without_cash)

  // Calculate total P/L
  const investmentRelatedCashFlows = data.cashFlows.filter(
    (cf) => cf.investment_related
  )
  const totalCashFlows = calculateCashFlows(investmentRelatedCashFlows)
  const totalPL = endingValueTotal
    .minus(initialValueTotal)
    .minus(totalCashFlows)

  // Calculate P/L without cash
  // Assuming cash flows do not directly affect 'without_cash' values
  const withoutCashPL = endingValueWithoutCash.minus(initialValueWithoutCash)

  return {
    total: totalPL.toNumber(),
    without_cash: withoutCashPL.toNumber(),
  }
}
