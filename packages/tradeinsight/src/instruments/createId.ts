import {
  type BondExchangeId,
  type BondOTCId,
  type DerivativeId,
  type ETFId,
  type ETPId,
  type ForexId,
  type FundId,
  type IndexId,
  type StockId,
  types,
} from './types'

export const createBondExchangeId = ({
  isin,
  mic,
  currency,
}: Omit<BondExchangeId, 'type'>) =>
  `${types.BNE}_${isin}_${mic}_${currency}`.toUpperCase()

export const createBondOTCId = ({ isin, currency }: Omit<BondOTCId, 'type'>) =>
  `${types.BND}_${isin}_${currency}`.toUpperCase()

export const createDerivativeId = ({
  ticker,
  mic,
  currency,
  strike,
  expiry,
}: Omit<DerivativeId, 'type'>) =>
  `${types.DER}_${ticker}_${mic}_${currency}_${strike}_${expiry}`.toUpperCase()

export const createETFId = ({ mic, isin, currency }: Omit<ETFId, 'type'>) =>
  `${types.ETF}_${isin}_${mic}_${currency}`.toUpperCase()

export const createETPId = ({ mic, isin, currency }: Omit<ETPId, 'type'>) =>
  `${types.ETP}_${isin}_${mic}_${currency}`.toUpperCase()

export const createFundId = ({ isin, currency }: Omit<FundId, 'type'>) =>
  `${types.FND}_${isin}_${currency}`.toUpperCase()

export const createIndexId = ({ ticker, currency }: Omit<IndexId, 'type'>) =>
  `${types.IDX}_${ticker}_${currency}`.toUpperCase()

export const createForexId = ({
  quoteCurrency,
  baseCurrency,
}: Omit<ForexId, 'type'>) =>
  `${types.FXS}_${baseCurrency}_${quoteCurrency}`.toUpperCase()

export const createStockId = ({ isin, mic, currency }: Omit<StockId, 'type'>) =>
  `${types.STO}_${isin}_${mic}_${currency}`.toUpperCase()
