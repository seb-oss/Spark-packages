import type {
  CashFlow,
  PerformanceCalculationInput,
  PeriodicValue,
  PortfolioValue,
} from './types'
import BigNumber from 'bignumber.js'
import { parseISO } from 'date-fns'

export function calculateSubPeriodReturn(
  beginValue: BigNumber,
  endValue: BigNumber,
  cashFlow: BigNumber = new BigNumber(0)
): BigNumber {
  if (beginValue.isEqualTo(0)) return new BigNumber(0)
  return endValue.minus(cashFlow).dividedBy(beginValue).minus(1)
}

export function compoundReturns(returns: BigNumber[]): BigNumber {
  const compounded = returns.reduce(
    (acc, curr) => acc.multipliedBy(curr.plus(1)),
    new BigNumber(1)
  )
  return compounded.minus(1)
}

export function getCashFlowForPeriod(
  cashFlows: CashFlow[],
  startDate: string,
  endDate: string
): BigNumber {
  return cashFlows
    .filter(
      (cf) =>
        parseISO(cf.date) >= parseISO(startDate) &&
        parseISO(cf.date) < parseISO(endDate)
    )
    .reduce((acc, cf) => acc.plus(new BigNumber(cf.amount)), new BigNumber(0))
}

export function processSubPeriods(
  periodicValues: PeriodicValue[],
  cashFlows: CashFlow[]
): BigNumber[] {
  const returns: BigNumber[] = []
  for (let i = 1; i < periodicValues.length; i++) {
    const prev = periodicValues[i - 1]
    const current = periodicValues[i]
    const cashFlow = getCashFlowForPeriod(cashFlows, prev.date, current.date)
    const returnForPeriod = calculateSubPeriodReturn(
      new BigNumber(prev.total),
      new BigNumber(current.total),
      cashFlow
    )
    returns.push(returnForPeriod)
  }
  return returns
}

export function calculateTWR(
  data: PerformanceCalculationInput
): PortfolioValue {
  const totalReturns = processSubPeriods(data.periodicValues, data.cashFlows)
  const totalTWR = compoundReturns(totalReturns)

  // Calculate TWR excluding cash by not considering cash flows for without_cash values
  const withoutCashReturns = processSubPeriods(
    data.periodicValues.map((pv) => ({ ...pv, total: pv.without_cash })),
    []
  )
  const withoutCashTWR = compoundReturns(withoutCashReturns)

  return {
    total: totalTWR.toNumber(),
    without_cash: withoutCashTWR.toNumber(),
  }
}
