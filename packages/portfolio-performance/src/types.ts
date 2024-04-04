export type CashFlow = {
  date: string
  amount: number
  investment_related: boolean
}

export type Transaction = {
  date: string
  type: 'buy' | 'sell'
  amount: number
  price: number
}

export type PeriodicValue = {
  date: string
  total: number
  without_cash: number
}

export type PortfolioValue = {
  total: number
  without_cash: number
}

export interface PerformanceCalculationInput {
  initialValue: PortfolioValue
  endingValue: PortfolioValue
  cashFlows: CashFlow[]
  transactions: Transaction[]
  periodicValues: PeriodicValue[]
  startDate: string // Specifically added for CAGR calculation
  endDate: string // Specifically added for CAGR calculation
}

export type Performance = {
  PL: PortfolioValue
  TWR: PortfolioValue
  CAGR: PortfolioValue
  AR: PortfolioValue
}
