import type {
  PerformanceCalculationInput,
  PeriodicValue,
  PortfolioValue,
} from './types'
import BigNumber from 'bignumber.js'

export const calculatePeriodicReturns = (
  periodicValues: PeriodicValue[]
): BigNumber[] => {
  const returns: BigNumber[] = []
  for (let i = 1; i < periodicValues.length; i++) {
    const prevValue = new BigNumber(periodicValues[i - 1].total)
    const currValue = new BigNumber(periodicValues[i].total)
    if (!prevValue.isZero()) {
      // Calculate return for the period and add to the returns array
      const periodReturn = currValue.minus(prevValue).dividedBy(prevValue)
      returns.push(periodReturn)
    }
  }
  return returns
}

export const calculateAverage = (returns: BigNumber[]): BigNumber => {
  if (returns.length === 0) return new BigNumber(0) // Avoid division by zero
  const sum = returns.reduce((acc, curr) => acc.plus(curr), new BigNumber(0))
  return sum.dividedBy(new BigNumber(returns.length))
}

export const calculateAR = (
  data: PerformanceCalculationInput
): PortfolioValue => {
  // Calculate total AR
  const totalReturns = calculatePeriodicReturns(data.periodicValues)
  const totalAR = calculateAverage(totalReturns)

  // Calculate AR excluding cash
  // Adjust periodic values to consider 'without_cash' values for calculation
  const withoutCashPeriodicValues = data.periodicValues.map((pv) => ({
    ...pv,
    total: pv.without_cash,
  }))
  const withoutCashReturns = calculatePeriodicReturns(withoutCashPeriodicValues)
  const withoutCashAR = calculateAverage(withoutCashReturns)

  return {
    total: totalAR.toNumber(),
    without_cash: withoutCashAR.toNumber(),
  }
}
