export const types = {
  BNE: 'BNE',
  BND: 'BND',
  DER: 'DER',
  ETF: 'ETF',
  ETP: 'ETP',
  FXS: 'FXS',
  FND: 'FND',
  IDX: 'IDX',
  STO: 'STO',
} as const

export type BondExchangeId = {
  type: (typeof types)['BNE']
  isin: string
  mic: string
  currency: string
}

export type BondOTCId = {
  type: (typeof types)['BND']
  isin: string
  currency: string
}

export type DerivativeId = {
  type: (typeof types)['DER']
  ticker: string
  mic: string
  currency: string
  strike: string
  expiry: string
}

export type ETFId = {
  type: (typeof types)['ETF']
  isin: string
  mic: string
  currency: string
}

export type ETPId = {
  type: (typeof types)['ETP']
  isin: string
  mic: string
  currency: string
}

export type ForexId = {
  type: (typeof types)['FXS']
  baseCurrency: string
  quoteCurrency: string
}

export type FundId = {
  type: (typeof types)['FND']
  isin: string
  currency: string
}

export type IndexId = {
  type: (typeof types)['IDX']
  ticker: string
  currency: string
}

export type StockId = {
  type: (typeof types)['STO']
  isin: string
  mic: string
  currency: string
}

export type TradeInsightId =
  | BondExchangeId
  | BondOTCId
  | DerivativeId
  | ETFId
  | ETPId
  | ForexId
  | FundId
  | IndexId
  | StockId
