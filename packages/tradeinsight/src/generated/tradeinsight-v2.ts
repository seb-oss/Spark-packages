/**
 * This file was auto-generated.
 * Do not make direct changes to the file.
 */

import type {
  APIResponse,
  APIServerDefinition,
  BaseClient,
  ExpressRequest,
  GenericRouteHandler,
  LowerCaseHeaders,
  PartiallySerialized,
  QueryParams,
  RequestOptions,
  Serialized,
} from '@sebspark/openapi-core'

type Req = Pick<ExpressRequest, 'url' | 'baseUrl' | 'cookies' | 'hostname'>

/* tslint:disable */
/* eslint-disable */

export type Instrument = {
  id: InstrumentId
  name: string
  identifiers?: InstrumentIdentifiers
  instrumentType: InstrumentTypeEnum
  instrumentSubType?: InstrumentSubTypeEnum
  listing: ListingInfo
  tradable: boolean
  price: PriceInfo
  fxBaseCurrency?: CurrencyCode
}

export type InstrumentEntity = {
  data: Instrument
  links: EntityLinks
}

export type InstrumentList = {
  data: InstrumentEntity[]
  links: PagingLinks
  meta: ListMeta
}

export type InstrumentId = string

/**
 * Unique codes and identifiers used to identify the instrument globally or within the trading venue/system.
 */
export type InstrumentIdentifiers = {
  /**
   * The short code (ticker symbol) used on the primary listing venue.
   */
  ticker?: string
  /**
   * The International Securities Identification Number.
   */
  isin?: string
  /**
   * The Morningstar Performance ID, often a critical identifier for Funds.
   */
  mpid?: string
}

export const QUOTE_STATUS_ENUM_VALUES = [
  'REALTIME',
  'DELAYED',
  'CLOSED',
  'AUCTION',
  'INDICATIVE',
  'NO_DATA',
  'NOT_APPLICABLE',
] as const
export type QuoteStatusEnum = (typeof QUOTE_STATUS_ENUM_VALUES)[number]

/**
 * Base properties shared by all price representations.
 */
export type PriceBase = {
  /**
   * The currency of the price data.
   */
  currency: CurrencyCode
  /**
   * The last known price or value.
   */
  last?: number
  /**
   * Absolute change from previous close/value.
   */
  change?: number
  /**
   * Percentage change from previous close/value.
   */
  percentChange?: number
  /**
   * The price/value at previous close or calculation.
   */
  previousClose?: number
}

/**
 * Pricing information for tradable instruments with bid/ask spreads (Stocks, FX, etc.).
 */
export type MarketPrice = PriceBase & {
  /**
   * Current highest price a buyer is willing to pay.
   */
  bid?: number
  /**
   * Current lowest price a seller is willing to accept.
   */
  ask?: number
  /**
   * The difference between the ask and bid prices.
   */
  spread?: number
}

/**
 * Pricing information for instruments with a single calculated value, such as Mutual Funds (NAV).
 */
export type SingleValuePrice = PriceBase & {
  /**
   * Net Asset Value (NAV) per unit. This is the primary value for funds.
   */
  nav?: number
}

/**
 * Aggregated pricing info where the native instrument is market-traded (uses MarketPrice for both native and base).
 */
export type PriceInfoBase = {
  /**
   * Indicates the status of the price quote (e.g., Realtime, Delayed, Closed).
   */
  quoteStatus: QuoteStatusEnum
  /**
   * Timestamp for the price data.
   */
  lastUpdated?: Date
}

export type MarketPriceInfo = PriceInfoBase & {
  /**
   * The market price data in the instrument's primary currency.
   */
  native: MarketPrice
  /**
   * The market price data expressed in the API base currency. Null if same as native.
   */
  base?: MarketPrice
}

export type SingleValuePriceInfo = PriceInfoBase & {
  /**
   * The single-value price data in the instrument's primary currency.
   */
  native: SingleValuePrice
  /**
   * The single-value price data expressed in the API base currency. Null if same as native.
   */
  base?: SingleValuePrice
}

/**
 * The pricing details, which vary depending on instrument type.
 */
export type PriceInfo = MarketPriceInfo | SingleValuePriceInfo

export type Sector = {
  id: string
  name: Localized
}

export type CoreIssuerInfo = {
  name: string
  lei?: string
  isins?: string[]
  country: string
  /**
   * The contact email address for the company.
   */
  email?: string
  /**
   * The primary contact phone number for the company.
   */
  phone?: string
  /**
   * The physical address of the company's main office or headquarters.
   */
  address?: string
  website?: string
  /**
   * The date on which the company was legally incorporated.
   */
  incorporationDate?: Date
  description?: Localized
  /**
   * The sector to which the company belongs, based on its primary business activities.
   */
  sector?: Sector
  /**
   * The industry category of the company, providing more specific detail than the sector.
   */
  subSector?: Sector
  /**
   * The total number of employees working for the company.
   */
  numberOfEmployees?: number
}

export type PersonNameAndRole = {
  name: string
  role?: string
}

export type CorporateManagement = {
  ceo?: string
  cfo?: string
  chairman?: string
  boardMembers?: PersonNameAndRole[]
  governanceUrl?: string
}

export type CorporateIssuerInfo = {
  core: CoreIssuerInfo
  management: CorporateManagement
}

export type CorporateIssuerEntity = {
  data: CorporateIssuerInfo
  links: EntityLinks
}

export type FundManagerInfo = {
  fundManager?: string
  managementCompany?: string
  managerSince?: Date
  domicile?: string
  teamMembers?: string[]
}

export type IssuerDocumentsInfo = {
  prospectusDate?: Date
  kiidDate?: Date
  factSheetUrl?: string
  prospectusUrl?: string
  annualReportUrl?: string
}

export type FundIssuerInfo = {
  core: CoreIssuerInfo
  fundManager: FundManagerInfo
  documents: IssuerDocumentsInfo
}

export type FundIssuerEntity = {
  data: FundIssuerInfo
  links: EntityLinks
}

export type TimeSeriesPoint = {
  /**
   * The end date of the reported period (e.g., YYYY-MM-DD, YYYY-MM, or YYYY for annual data).
   */
  date: string
  value: number
}

export type MetricSeries = {
  /**
   * The latest reported data point.
   */
  latest: TimeSeriesPoint
  history: TimeSeriesPoint[]
}

/**
 * Growth and valuation metrics.
 */
export type KeyFiguresGrowth = {
  /**
   * EPS Growth
   */
  epsGrowth?: MetricSeries
  /**
   * Profit Growth
   */
  profitGrowth?: MetricSeries
  /**
   * Revenue (Turnover)
   */
  revenue?: MetricSeries
  /**
   * Revenue Growth
   */
  revenueGrowth?: MetricSeries
  /**
   * Profit Before Tax (PBT)
   */
  ptp?: MetricSeries
  /**
   * Net Debt / EBITDA
   */
  netDebtPerEBITDA?: MetricSeries
  /**
   * EV / Sales
   */
  evPerSales?: MetricSeries
  /**
   * Price / Book Value (P/BV)
   */
  pPerBv?: MetricSeries
  /**
   * Dividend Per Share
   */
  dividendPerShare?: MetricSeries
}

/**
 * Profitability metrics.
 */
export type KeyFiguresProfitability = {
  /**
   * Earnings Per Share (EPS)
   */
  eps?: MetricSeries
  /**
   * Operating Margin
   */
  operatingMargin?: MetricSeries
  /**
   * Free Cash Flow (FCF)
   */
  fcf?: MetricSeries
  /**
   * Return on Capital Employed (ROCE)
   */
  roce?: MetricSeries
  /**
   * Adjusted EBITDA
   */
  ebitdaAdjusted?: MetricSeries
}

/**
 * Risk and liquidity metrics.
 */
export type KeyFiguresRiskAndLiquidity = {
  /**
   * Volatility
   */
  volatility?: MetricSeries
  /**
   * Average Daily Volume (ADV)
   */
  adv?: MetricSeries
  /**
   * Average Daily Turnover (ADT)
   */
  adt?: MetricSeries
}

/**
 * Aggregated key financial figures, grouped by business domain.
 */
export type IssuerFundamentals = {
  growth: KeyFiguresGrowth
  profitability: KeyFiguresProfitability
  riskAndLiquidity: KeyFiguresRiskAndLiquidity
  /**
   * The primary reporting currency for monetary figures within this response.
   */
  currency: CurrencyCode
  /**
   * The data source.
   */
  source?: string
}

export type IssuerFundamentalsEntity = {
  data: IssuerFundamentals
  links: EntityLinks
}

export type PerformanceData = {
  '1w': number
  '1m': number
  '3m': number
  '6m': number
  '1y': number
  '2y': number
  '3y': number
  '5y': number
  wtd: number
  mtd: number
  ytd: number
}

export type Performance = {
  close: PerformanceData
  change: PerformanceData
  pctChange: PerformanceData
  high: PerformanceData
  low: PerformanceData
  lastDiv: PerformanceData
  lastTrade: number
  lastTradeDate: Date
  rsi13: {
    gain?: number
    loss?: number
  }
  rsi14: number
}

export type PerformanceEntity = {
  data: Performance
  links: EntityLinks
}

export type SecurityTrading = {
  /**
   * Most recent actual trade for the instrument.
   */
  lastTrade?: {
    time: Date
    price: number
    volume: number
  }
  /**
   * Accumulated traded volume for the current trading day.
   */
  volume?: number
  /**
   * Accumulated traded value for the current trading day (price × volume).
   */
  turnover?: number
  /**
   * Volume-weighted average price for the current trading day.
   */
  vwap?: number
  tradingStatus: TradingStatusEnum
  tickSizes?: TickSize[]
}

export type SecurityTradingEntity = {
  data: SecurityTrading
  links: EntityLinks
}

export type FundTrading = {
  nextOrderCutoff?: Date
  minimumInvestment?: number
  tradingCurrency: string
  pricingFrequency?: string
  valuationFrequency?: string
  cutoffTime?: string
  tradeDateBuy?: string
  tradeDateSell?: string
  settlementBuy?: string
  settlementSell?: string
}

export type FundTradingEntity = {
  data: FundTrading
  links: EntityLinks
}

export type OrderbookLevel = {
  level: number
  price: number
  volume: number
  numOrders?: number
}

export type Orderbook = {
  ask: OrderbookLevel[]
  bid: OrderbookLevel[]
  /**
   * Highest volume among all bid/ask levels in the book.
   */
  maxVolume?: number
  /**
   * Recommended refresh interval in seconds for this orderbook feed.
   */
  refresh?: number
}

export type OrderbookEntity = {
  data: Orderbook
  links: EntityLinks
}

export type Trade = {
  time: Date
  price: number
  volume: number
  buyer?: string
  seller?: string
  sequenceId?: number
  market?: Mic
}

export type LatestTrades = {
  trades: Trade[]
  /**
   * Total volume of trades in this list.
   */
  totalVolume: number
  /**
   * Total value (turnover) of trades in this list.
   */
  totalValue: number
  /**
   * Volume Weighted Average Price (VWAP) for trades in this list.
   */
  vwap: number
}

export type LatestTradesEntity = {
  data: LatestTrades
  links: EntityLinks
}

export const HISTORY_WINDOW_VALUES = [
  '1D_1MIN',
  '1D_2MIN',
  '1D_5MIN',
  '1D_10MIN',
  '1D_30MIN',
  '1D_60MIN',
  '1W_10MIN',
  '1W_30MIN',
  '1W_60MIN',
  '1W_1D',
  '1M_60MIN',
  '1M_1D',
  '1M_1W',
  '3M_1D',
  '3M_1W',
  '3M_1M',
  'YTD_1D',
  'YTD_1W',
  'YTD_1M',
  '1Y_1D',
  '1Y_1W',
  '1Y_1M',
  '1Y_1Q',
  '3Y_1D',
  '3Y_1W',
  '3Y_1M',
  '3Y_1Q',
  '5Y_1D',
  '5Y_1W',
  '5Y_1M',
  '5Y_1Q',
  '5Y_EOY',
  'MAX_1W',
  'MAX_1M',
  'MAX_1Q',
] as const
export type HistoryWindow = (typeof HISTORY_WINDOW_VALUES)[number]

export type HistoryPoint = {
  time: Date
  last?: number
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
  turnover?: number
  bid?: number
  ask?: number
}

export type History = {
  window: HistoryWindow
  points: HistoryPoint[]
}

export type HistoryEntity = {
  data: History
  links: EntityLinks
}

export type FundHistoryPoint = {
  time: Date
  nav?: number
}

export type FundHistory = {
  window: HistoryWindow
  points: FundHistoryPoint[]
}

export type FundHistoryEntity = {
  data: FundHistory
  links: EntityLinks
}

export type Allocation = {
  name: string
  weight: number
  weightChange?: number
}

export type Holdings = {
  topHoldings: Allocation &
    {
      instrumentId?: string
      country: Country
      instrumentType: InstrumentTypeEnum
    }[]
  countryAllocation?: Allocation[]
  regionAllocation?: Allocation[]
  sectorAllocation?: Allocation[]
  creditQualityAllocation?: Allocation[]
  maturityAllocation?: Allocation[]
}

export type HoldingsEntity = {
  data: Holdings
  links: EntityLinks
}

export type ProspectusFees = {
  performanceFeeCharged?: string
  managementFee?: number
  maxManagementFee?: number
  prospectusGrossExpenseRatio?: number
  prospectusNetExpenseRatio?: number
  prospectusDate?: Date
  feeEffectiveDate?: Date
  deferredLoad?: number
  maxFrontLoad?: number
}

export type MifidFees = {
  distributionFeePercentageOfNavEstimated?: number
  managementFeeExDistributionFeesActual?: number
  managementFeeExDistributionFeesEstimated?: number
  ongoingCostActual?: number
  ongoingCostEstimated?: number
  performanceFeeActual?: number
  performanceFeeEstimated?: number
  transactionFeeActual?: number
  transactionFeeEstimated?: number
  maximumEntryCostPercentage?: number
}

export type KiidFees = {
  ongoingCharge?: number
  ongoingChargeDate?: Date
}

export type Fees = {
  prospectus?: ProspectusFees
  mifid?: MifidFees
  kiid?: KiidFees
}

export type FeesEntity = {
  data: Fees
  links: EntityLinks
}

export type FundMetrics = {
  alpha?: MetricSeries
  beta?: MetricSeries
  /**
   * R-squared value.
   */
  rSquared?: MetricSeries
  trackingError?: MetricSeries
  maxDrawdown?: MetricSeries
  sortinoRatio?: MetricSeries
  informationRatio?: MetricSeries
  /**
   * Synthetic Risk and Reward Indicator (SRRI) score 1-7 (value property).
   */
  srri?: MetricSeries
}

export type FundMetricsEntity = {
  data: FundMetrics
  links: EntityLinks
}

export type ESGAttributeValue = {
  /**
   * Last report year
   */
  fiscalYear?: number
  type: 'reported' | 'calculated' | 'estimated' | 'unknown'
}

export const AMBITION_SCORE_VALUES = [1, 2, 3, 4] as const
export type AmbitionScore = (typeof AMBITION_SCORE_VALUES)[number]

export type NumberScope = ESGAttributeValue & {
  value: number
}

export type BooleanScope = ESGAttributeValue & {
  value: boolean
}

/**
 * 1 is good, 4 is bad
 */
export type CarbonReductionAmbitionScore = ESGAttributeValue & {
  value: AmbitionScore
  rationale?: string
}

export type CarbonIntensity = {
  value: NumberScope
  globalSectorAverage: NumberScope
  industryAverage?: NumberScope
}

export type CarbonEmissions = {
  scope12: NumberScope
  scope3: NumberScope
  /**
   * Directionality of emission development (e.g. decreasing, stable, increasing)
   */
  trend?: string
}

export type GenderEquality = ESGAttributeValue & {
  m: number
  f: number
  sectorBenchmark?: number
}

export type CorporateResponsibility = {
  hasUngcOecdProcesses: BooleanScope
  isUngcOecdCompliant: BooleanScope
  score?: number
}

/**
 * ISS temperature score
 */
export type ISSTemperatureScore = NumberScope & {
  sectorAverage?: NumberScope
}

export type ESGData = {
  carbonReductionAmbitionScore?: CarbonReductionAmbitionScore
  carbonIntensity?: CarbonIntensity
  boardGenderEquality?: GenderEquality
  issTemperatureScore?: ISSTemperatureScore
  carbonEmissions?: CarbonEmissions
  corporateResponsibility?: CorporateResponsibility
  coverage?: number
  ghgIntensity?: NumberScope
  exposures?: Record<string, number>
}

export type TaxonomyMetricValue = {
  source?: string
  value?: number
  aligned?: number
  validFrom?: Date
  validTo?: Date
  refreshDate?: Date
  reportDate?: Date
  coverage?: number
  fiscalYear?: number
  factsetEntityIdInheritedFrom?: string
}

export type TaxonomyMetricGroup = {
  reported?: TaxonomyMetricValue
  estimated?: TaxonomyMetricValue
  calculated?: TaxonomyMetricValue
  calculatedWithInheritance?: TaxonomyMetricValue
  inherited?: TaxonomyMetricValue
}

export type TaxonomyDimension = {
  aligned?: TaxonomyMetricGroup
  eligible?: TaxonomyMetricGroup
}

export type TaxonomyActivityCategory = {
  revenue?: TaxonomyMetricGroup
  capEx?: TaxonomyMetricGroup
  opEx?: TaxonomyMetricGroup
}

export type TaxonomyEnvironmentalObjective = {
  transitioning?: TaxonomyActivityCategory
  enabling?: TaxonomyActivityCategory
  ownContribution?: TaxonomyActivityCategory
}

export type TaxonomyAggregateData = {
  totals?: {
    opEx?: TaxonomyDimension
    capEx?: TaxonomyDimension
    revenue?: TaxonomyDimension
  }
  aggregated?: {
    climateMitigation?: TaxonomyEnvironmentalObjective
    climateAdaptation?: TaxonomyEnvironmentalObjective
  }
}

export type IssuerTaxonomy = {
  isin: string
  factsetId?: string
  taxonomyData: TaxonomyAggregateData
}

export type IssuerTaxonomyEntity = {
  data: IssuerTaxonomy
  links: EntityLinks
}

export type PortfolioTaxonomy = {
  instrumentIsin: string
  assetClass?: string
  /**
   * Percentage of the portfolio covered by the taxonomy calculation.
   */
  aggregationCoverage?: number
  taxonomyData: TaxonomyAggregateData
}

export type PortfolioTaxonomyEntity = {
  data: PortfolioTaxonomy
  links: EntityLinks
}

export type Sustainability = {
  provider: string
  asOf: Date
  dataQuality?: string
}

export type IssuerSustainability = Sustainability & {
  esg: ESGData
}

export type IssuerSustainabilityEntity = {
  data: IssuerSustainability
  links: EntityLinks
}

export type PortfolioSustainabilityStrategy = {
  focusLabel: string
  /**
   * e.g. SFDR Article 6/8/9 or similar
   */
  euSustainableClassification?: string
}

export type PortfolioSustainabilityIndicator = {
  score: number
  minScore?: number
  maxScore?: number
  betterIsLower?: boolean
  categoryComparison?: {
    fundScore: number
    bestScore: number
    worstScore: number
    numberOfFunds: number
  }
}

export type PortfolioSustainabilityRating = {
  rating: number
  categoryName?: string
}

export type ControversialExposure = {
  category: string
  weight: number
}

export type PortfolioSustainability = Sustainability & {
  strategy: PortfolioSustainabilityStrategy
  indicator: PortfolioSustainabilityIndicator
  rating: PortfolioSustainabilityRating
  controversialExposures?: ControversialExposure[]
}

export type PortfolioSustainabilityEntity = {
  data: PortfolioSustainability
  links: EntityLinks
}

export type Events = {
  dividends: {
    date: Date
    amount: number
    currency: CurrencyCode
  }[]
  splits: {
    date: Date
    factor: number
  }[]
  corporateActions: {
    type: string
    date: Date
    description?: string
  }[]
}

/**
 * Represents where the instrument is listed, registered or priced.
 */
export type ListingInfo = {
  /**
   * MIC or Segment MIC, if the instrument is exchange-listed.
   */
  mic?: Mic
  /**
   * Operating MIC if applicable.
   */
  operatingMic?: OperatingMIC
  /**
   * Country of listing, registration or provider.
   */
  country?: Country
  /**
   * Name of exchange, provider, registry, issuer or FX venue.
   */
  venue: string
}

export const OPERATING_MIC_VALUES = [
  'XHEL',
  'XCSE',
  'XSTO',
  'XOSL',
  'XSAT',
  'MTAA',
  'XAMS',
  'XBRU',
  'XETR',
  'XLIS',
  'XLON',
  'XMAD',
  'XPAR',
  'XNAS',
  'XNYS',
  'XTSE',
  'XNGM',
] as const
export type OperatingMIC = (typeof OPERATING_MIC_VALUES)[number]

export const SEGMENT_MIC_VALUES = [
  'FNFI',
  'FSME',
  'DSME',
  'SSME',
  'XNGM',
  'NSME',
  'XASE',
  'MERK',
  'XOAS',
] as const
export type SegmentMIC = (typeof SEGMENT_MIC_VALUES)[number]

/**
 * Market identifier code (Operating or Segment MIC)
 */
export type Mic = OperatingMIC | SegmentMIC

export type Country = {
  code: string
  name: string
}

export type Isin = string

export const INSTRUMENT_TYPE_ENUM_VALUES = [
  'STOCK',
  'INDEX',
  'FOREX',
  'FUND',
] as const
export type InstrumentTypeEnum = (typeof INSTRUMENT_TYPE_ENUM_VALUES)[number]

export const INDEX_SUB_TYPE_ENUM_VALUES = [
  'INDEX_BALANCE',
  'INDEX_CREDIT',
  'INDEX_COMMODITY',
  'INDEX_CURRENCY',
  'INDEX_RATE',
  'INDEX_STOCK',
] as const
export type IndexSubTypeEnum = (typeof INDEX_SUB_TYPE_ENUM_VALUES)[number]

export const FOREX_SUB_TYPE_ENUM_VALUES = ['FOREX_SPOT'] as const
export type ForexSubTypeEnum = (typeof FOREX_SUB_TYPE_ENUM_VALUES)[number]

export const FUND_SUB_TYPE_ENUM_VALUES = ['FUND_ETF', 'FUND_MUTUAL'] as const
export type FundSubTypeEnum = (typeof FUND_SUB_TYPE_ENUM_VALUES)[number]

export const STOCK_SUB_TYPE_ENUM_VALUES = [
  'STOCK_COMMON',
  'STOCK_DEPO_RECEIP_ON_EQUITIES',
  'STOCK_PREFERRED',
  'STOCK_RIGHT',
  'STOCK_SUBSCRIPTION_OPTION',
] as const
export type StockSubTypeEnum = (typeof STOCK_SUB_TYPE_ENUM_VALUES)[number]

export const OTHER_SUB_TYPE_ENUM_VALUES = ['NONE', 'UNKNOWN'] as const
export type OtherSubTypeEnum = (typeof OTHER_SUB_TYPE_ENUM_VALUES)[number]

export type InstrumentSubTypeEnum =
  | IndexSubTypeEnum
  | ForexSubTypeEnum
  | FundSubTypeEnum
  | StockSubTypeEnum
  | OtherSubTypeEnum

export const CURRENCY_CODE_VALUES = [
  'USD',
  'JPY',
  'GBP',
  'GBX',
  'KES',
  'NGN',
  'BYN',
  'BWP',
  'MUR',
  'EUR',
  'CAD',
  'AUD',
  'CHF',
  'CNH',
  'CNY',
  'SEK',
  'NOK',
  'KRW',
  'DKK',
  'ISK',
  'HKD',
  'SGD',
  'HUF',
  'CZK',
  'NZD',
  'MXN',
  'PLN',
  'RUB',
  'INR',
  'BRL',
  'THB',
  'RON',
  'AED',
  'TRY',
  'MYR',
  'BHD',
  'ZAR',
  'ZAC',
  'PKR',
  'BDT',
  'BGN',
  'HRK',
  'TWD',
  'UAH',
  'ARS',
  'ILS',
  'MAD',
  'PHP',
  'COP',
  'SAR',
  'CLP',
  'EGP',
  'QAR',
  'VND',
  'IDR',
] as const
export type CurrencyCode = (typeof CURRENCY_CODE_VALUES)[number]

export const TRADING_STATUS_ENUM_VALUES = [
  'TRADING',
  'CONTINUOUS',
  'CLOSED',
  'SUSPENDED',
  'PRE_MARKET',
  'POST_MARKET',
  'END_OF_DAY',
  'NOT_AVAILABLE',
  'AUCTION',
  'OTHER',
] as const
export type TradingStatusEnum = (typeof TRADING_STATUS_ENUM_VALUES)[number]

export type TradingHours = {
  /**
   * The market open time (UTC).
   */
  openTime: Date
  /**
   * The market close time (UTC).
   */
  closeTime: Date
  /**
   * Flag indicating if the market is currently open.
   */
  isMarketOpen: boolean
}

export type Market = {
  /**
   * The unique primary Market Identifier Code (MIC) for routing, matching either the Operating or Segment MIC.
   */
  mic: string
  /**
   * Name of the market service.
   */
  name: string
  /**
   * Name of the data provider for this market.
   */
  provider: string
  /**
   * Access level of the market data (Realtime, Delayed, or Updated daily).
   */
  access: string
  /**
   * The country associated with the market.
   */
  country: Country
  /**
   * List of data types available in this market.
   */
  instrumentTypes: InstrumentTypeEnum[]
  /**
   * The current day's specific trading hours for this market.
   */
  todaysTradingHours: TradingHours
}

export type MarketEntity = {
  data: Market
  links: EntityLinks
}

export type MarketDetails = Market & {
  /**
   * The Operating MIC (Exchange) that this market belongs to.
   */
  operatingMic: OperatingMIC
  /**
   * The specific Segment MIC if this market represents a sub-segment. If present, it typically matches the primary 'mic' field.
   */
  segmentMic?: SegmentMIC
  staticTradingHours: {
    /**
     * Start time of regular market operations (UTC).
     */
    startTime: string
    /**
     * End time of regular market operations (UTC).
     */
    endTime: string
    /**
     * Flag indicating if the market operates all day.
     */
    allDay?: boolean
    /**
     * Local time offset from UTC.
     */
    localTimeOffset: string
  }
  dataQuality: {
    /**
     * Minimum delay in seconds for market data.
     */
    minDelaySecs: number
    /**
     * Maximum delay in seconds for market data.
     */
    maxDelaySecs: number
    /**
     * Flag indicating whether the market provides a full feed.
     */
    fullFeed?: boolean
    /**
     * Flag indicating whether trade data is available.
     */
    tradesAvailable?: boolean
    /**
     * Flag indicating whether buyer and seller information is available.
     */
    buyerSellerAvailable?: boolean
  }
  /**
   * The number of decimal places used in the market's pricing.
   */
  decimals: number
  /**
   * The key indices or benchmark instruments associated with the market.
   */
  indices: Instrument[]
}

export type MarketDetailsEntity = {
  data: MarketDetails
  links: EntityLinks
}

export type MarketList = {
  data: MarketEntity[]
  links: PagingLinks
  meta: ListMeta
}

export type NewsSource = {
  id: number
  /**
   * Country that this news source covers
   */
  country: Country
  /**
   * News source name
   */
  name: string
}

export type NewsSourceListEntity = {
  data: NewsSource[]
  links: PagingLinks
  meta: ListMeta
}

export type NewsArticle = {
  /**
   * Unique identifier for the news item.
   */
  id: string
  /**
   * News item headline
   */
  headline: string
  /**
   * News item category
   */
  category?: string
  /**
   * Publish or update time.
   */
  time: Date
  /**
   * News body
   */
  body?: string
  /**
   * A list of instruments related to the news article
   */
  instruments?: Instrument[]
  source: NewsSource
}

export type NewsListEntity = {
  data: NewsArticleEntity[]
  links: PagingLinks
  meta: CursorMeta
}

export type NewsArticleEntity = {
  data: NewsArticle
  links: EntityLinks
}

export type EntityLinks = Record<string, string> & {
  self: string
}

export type PagingLinks = {
  self: string
  next?: string
  prev?: string
}

export type ListMeta = {
  total: number
  page: number
  pageSize: number
}

/**
 * Metadata for cursor-based pagination, providing the total count and the specific tokens (cursors) required to construct links to the previous and next pages.
 */
export type CursorMeta = {
  /**
   * The total number of available records in the collection.
   */
  total: number
  /**
   * An opaque token (cursor) to retrieve the next page of results (null if on the last page).
   */
  nextCursor?: string
  /**
   * An opaque token (cursor) to retrieve the previous page of results (null if on the first page).
   */
  prevCursor?: string
}

export const INSTRUMENT_METADATA_SORT_ENUM_VALUES = ['NAME', 'TICKER'] as const
export type InstrumentMetadataSortEnum =
  (typeof INSTRUMENT_METADATA_SORT_ENUM_VALUES)[number]

export const INSTRUMENT_PERFORMANCE_SORT_ENUM_VALUES = [
  'PCT_CHANGE',
  'LV_PCT_CHANGE',
  'TURNOVER',
  'VOLUME',
  'ONE_W_PCT_CHANGE',
  'ONE_M_PCT_CHANGE',
  'THREE_M_PCT_CHANGE',
  'SIX_M_PCT_CHANGE',
  'ONE_Y_PCT_CHANGE',
  'TWO_Y_PCT_CHANGE',
  'THREE_Y_PCT_CHANGE',
  'FIVE_Y_PCT_CHANGE',
  'YTD_PCT_CHANGE',
] as const
export type InstrumentPerformanceSortEnum =
  (typeof INSTRUMENT_PERFORMANCE_SORT_ENUM_VALUES)[number]

export const FUND_METRICS_SORT_ENUM_VALUES = [
  'SRRI',
  'ALPHA',
  'BETA',
  'R_SQUARED',
  'TRACKING_ERROR',
  'MAX_DRAWDOWN',
  'SORTINO_RATIO',
  'INFORMATION_RATIO',
] as const
export type FundMetricsSortEnum = (typeof FUND_METRICS_SORT_ENUM_VALUES)[number]

export const CONVERSION_CURRENCY_CODE_VALUES = [
  'AED',
  'AUD',
  'BGN',
  'CAD',
  'CHF',
  'CNY',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'HUF',
  'ILS',
  'ISK',
  'JPY',
  'NOK',
  'NZD',
  'PLN',
  'SEK',
  'SGD',
  'THB',
  'USD',
  'ZAR',
] as const
export type ConversionCurrencyCode =
  (typeof CONVERSION_CURRENCY_CODE_VALUES)[number]

/**
 * The official FX rate used by the system for conversion between currencies, e.g., for displaying prices in the user's base currency.
 */
export type ConversionRate = {
  baseCurrency: ConversionCurrencyCode
  quoteCurrency: ConversionCurrencyCode
  /**
   * The authoritative mid-rate used for conversion (quote / base).
   */
  conversionRate: number
  /**
   * The time the rate was last updated in the system.
   */
  updatedAt: Date
}

/**
 * An entity wrapper for a single authoritative ConversionRate, including self-link.
 */
export type ConversionRateEntity = {
  data: ConversionRate
  links: EntityLinks
}

/**
 * A list of authoritative ConversionRate entities.
 */
export type ConversionRateList = {
  data: ConversionRateEntity[]
  links: EntityLinks
}

export type TickSize = {
  /**
   * Upper bound of the price range for which this tick size rule applies.
   */
  upperBound: number
  /**
   * The minimum price movement (tick size) for the given price range.
   */
  size: number
}

export const SORT_ORDER_ENUM_VALUES = ['ASC', 'DESC'] as const
export type SortOrderEnum = (typeof SORT_ORDER_ENUM_VALUES)[number]

export type Localized = {
  /**
   * Svenska
   */
  sv?: string
  /**
   * English
   */
  en?: string
}

export type ErrorResponse = {
  error: string
  message: string
  requestId?: string
}

export const HEALTH_CHECK_STATUS_VALUE_VALUES = [
  'ok',
  'degraded',
  'error',
] as const
export type HealthCheck_StatusValue =
  (typeof HEALTH_CHECK_STATUS_VALUE_VALUES)[number]

export const HEALTH_CHECK_IMPACT_VALUES = ['critical', 'non_critical'] as const
export type HealthCheck_Impact = (typeof HEALTH_CHECK_IMPACT_VALUES)[number]

export const HEALTH_CHECK_MODE_VALUES = ['inline', 'polled', 'async'] as const
export type HealthCheck_Mode = (typeof HEALTH_CHECK_MODE_VALUES)[number]

export type HealthCheck_Status = {
  status: HealthCheck_StatusValue
}

export type HealthCheck_System = {
  hostname: string
  /**
   * NodeJS.Platform
   */
  platform: string
  release: string
  /**
   * e.g., x64, arm64
   */
  arch: string
  /**
   * Seconds.
   */
  uptime: number
  /**
   * Load averages for 1, 5, 15 minutes.
   */
  loadavg: number[]
  totalmem: number
  freemem: number
  memUsedRatio: number
  cpus: {
    count: number
    model?: string
    speedMHz?: number
  }
}

/**
 * Process memory usage (NodeJS.MemoryUsage).
 */
export type HealthCheck_MemoryUsage = Record<string, number> & {
  rss?: number
  heapTotal?: number
  heapUsed?: number
  external?: number
  arrayBuffers?: number
}

export type HealthCheck_Process = {
  pid: number
  /**
   * Node.js version string.
   */
  node: string
  /**
   * Seconds.
   */
  uptime: number
  memory: HealthCheck_MemoryUsage
}

export type HealthCheck_Liveness = HealthCheck_Status & {
  timestamp: string
  system: HealthCheck_System
  process: HealthCheck_Process
}

export type HealthCheck_Freshness = {
  lastChecked: string
  lastSuccess: string | null
}

export type HealthCheck_Observed = Record<string, unknown> & {
  latencyMs?: number | null
}

export type HealthCheck_CheckError = {
  code: string
  message: string
}

export type HealthCheck_DependencyCheck = HealthCheck_Status & {
  impact: HealthCheck_Impact
  mode: HealthCheck_Mode
  freshness: HealthCheck_Freshness
  observed?: HealthCheck_Observed
  details?: Record<string, unknown>
  error?: unknown
  since?: string | null
}

export type HealthCheck_ReadinessSummary = {
  critical: {
    ok: number
    failing: number
  }
  nonCritical: {
    ok: number
    degraded: number
    failing: number
  }
  degradedReasons: string[]
}

export type HealthCheck_ReadinessPayload = HealthCheck_Status & {
  timestamp: string
  service?: {
    name?: string
    version?: string
    instanceId?: string
  }
  summary: HealthCheck_ReadinessSummary
  /**
   * Keyed by dependency name.
   */
  checks: Record<string, HealthCheck_DependencyCheck>
}

export type HealthCheck_HealthSummary = HealthCheck_Status & {
  timestamp: string
  summary: HealthCheck_ReadinessSummary
  checks: Record<string, HealthCheck_DependencyCheck>
  system: HealthCheck_System
  process: HealthCheck_Process
}

export type BaseCurrency = {
  base?: ConversionCurrencyCode
}

export type InstrumentIdParam = {
  id: string
}

export type OrderbookDepth = {
  depth?: number
}

export type HistoryWindowParam = {
  window: HistoryWindow
}

export type FilterFrom = {
  from?: Date
}

export type FilterTo = {
  to?: Date
}

export type SearchQuery = {
  query?: string
}

export type SortBy = {
  sort?:
    | InstrumentMetadataSortEnum
    | InstrumentPerformanceSortEnum
    | FundMetricsSortEnum
}

export type SortOrder = {
  order?: SortOrderEnum
}

export type FilterByMICs = {
  mic?: Mic[]
}

export type FilterByOperatingMICs = {
  operatingMic?: OperatingMIC[]
}

export type FilterByISINs = {
  isin?: Isin[]
}

export type FilterByCurrencies = {
  cur?: CurrencyCode[]
}

export type FilterByInstrumentTypes = {
  type?: InstrumentTypeEnum[]
}

export type FilterByInstrumentSubTypes = {
  subType?: InstrumentSubTypeEnum[]
}

export type FilterByCountries = {
  countryCodes?: string[]
}

export type FilterByInstruments = {
  instruments?: string[]
}

export type Page = {
  page?: number
}

export type PageSize = {
  pageSize?: number
}

export type PageToken = {
  pageToken?: string
}

export type FilterByNewsTypes = {
  types?: string[]
}

export type FilterByNewsCategories = {
  categories?: string[]
}

export type RateId = {
  rateId: string
}

/**
 * Bad Request
 */
export type BadRequest = APIResponse<PartiallySerialized<ErrorResponse>>

/**
 * Unauthorized – missing or invalid authentication.
 */
export type UnauthorizedResponse = APIResponse<
  PartiallySerialized<ErrorResponse>
>

/**
 * Forbidden – authenticated but not allowed to access this resource.
 */
export type ForbiddenResponse = APIResponse<PartiallySerialized<ErrorResponse>>

/**
 * Not Found
 */
export type NotFoundResponse = APIResponse<PartiallySerialized<ErrorResponse>>

/**
 * Too many requests – rate limit exceeded.
 */
export type TooManyRequestsResponse = APIResponse<
  PartiallySerialized<ErrorResponse>
>

/**
 * Internal server error.
 */
export type InternalServerErrorResponse = APIResponse<
  PartiallySerialized<ErrorResponse>
>

/**
 * Not implemented.
 */
export type NotImplementedResponse = APIResponse<
  PartiallySerialized<ErrorResponse>
>

export type TradeinsightVServerPaths = {
  '/health': {
    get: {
      /**
       * Combined view of status, system/process metrics, and readiness summary.
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HealthCheck_HealthSummary>>]>}
       */
      handler: (
        args: Req,
      ) => Promise<
        [200, APIResponse<PartiallySerialized<HealthCheck_HealthSummary>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/health/ping': {
    get: {
      /**
       * Basic health status.
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HealthCheck_Status>>]>}
       */
      handler: (
        args: Req,
      ) => Promise<[200, APIResponse<PartiallySerialized<HealthCheck_Status>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/health/live': {
    get: {
      /**
       * Liveness signal with system and process metrics.
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HealthCheck_Liveness>>]>}
       */
      handler: (
        args: Req,
      ) => Promise<
        [200, APIResponse<PartiallySerialized<HealthCheck_Liveness>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/health/ready': {
    get: {
      /**
       * Readiness including dependency checks and summary.
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HealthCheck_ReadinessPayload>>]>}
       */
      handler: (
        args: Req,
      ) => Promise<
        [200, APIResponse<PartiallySerialized<HealthCheck_ReadinessPayload>>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/markets': {
    get: {
      /**
       * This endpoint provides a comprehensive, paginated list of Market Identifier Codes (MICs) currently supported by the API. It's essential for Product Managers needing to know which trading venues and exchanges are available for the end-customer offering, allowing for dynamic selection and display of trading options.
       *
       * @param {Object} [args] - Optional. The arguments for the request.
       * @param {PageSize & Page} [args.query] - Optional. Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<MarketList>>] | [401, UnauthorizedResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args?: Req & { query?: QueryParams<PageSize & Page> },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<MarketList>>]
        | [401, UnauthorizedResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/markets/:mic': {
    get: {
      /**
       * Retrieves static and operational details for a specific trading venue identified by its MIC. This includes the legal operating entity, trading hours, country of operation, and standardized market segments. Use this to display accurate regulatory and operational context when presenting a venue to a user.
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {MIC} args.params.mic
       * @returns {Promise<[200, APIResponse<PartiallySerialized<MarketDetailsEntity>>] | [401, UnauthorizedResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & {
          params: {
            mic: Mic
          }
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<MarketDetailsEntity>>]
        | [401, UnauthorizedResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments': {
    get: {
      /**
       * This powerful endpoint allows users to filter, search, and screen the entire instrument universe. It's the primary tool for building search functionality, category views, and instrument lists for the end-user application. Developers can combine filtering by MIC, ISIN, country, and instrument type to precisely target the instruments tradable on specific platforms, ensuring the user only sees relevant products. Pagination and sorting are supported for efficient client-side rendering.
       *
       * @param {Object} [args] - Optional. The arguments for the request.
       * @param {FilterByCountries & FilterByMICs & FilterByOperatingMICs & FilterByISINs & FilterByCurrencies & FilterByInstrumentTypes & FilterByInstrumentSubTypes & FilterByInstruments & SearchQuery & SortBy & SortOrder & BaseCurrency} [args.query] - Optional. Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<InstrumentList>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args?: Req & {
          query?: QueryParams<
            FilterByCountries &
              FilterByMICs &
              FilterByOperatingMICs &
              FilterByISINs &
              FilterByCurrencies &
              FilterByInstrumentTypes &
              FilterByInstrumentSubTypes &
              FilterByInstruments &
              SearchQuery &
              SortBy &
              SortOrder &
              BaseCurrency
          >
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<InstrumentList>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id': {
    get: {
      /**
       * Retrieves the canonical record for a single instrument, providing all essential information in one call: name, identifiers, listing details, tradability status, and the current market price. Critically, this response also includes the links object, which acts as a dynamic roadmap to all related sub-data (e.g., fundamentals, trading rules, history) specific to that instrument type (Stock, Fund, or Derivative). Use this as the foundation for the instrument detail page.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @param {BaseCurrency} [args.query] - Optional. Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<InstrumentEntity>>] | [400, BadRequest] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & {
          params: InstrumentIdParam
          query?: QueryParams<BaseCurrency>
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<InstrumentEntity>>]
        | [400, BadRequest]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/issuer': {
    get: {
      /**
       * Retrieves the static core data for the corporate entity (or equivalent) that issued the security (e.g., stocks, corporate bonds, most ETFs). This includes the company's address, contact details, official identifiers (like LEI), and key management contacts (CEO, CFO). It provides the foundational identity context required for compliance, due diligence, and information display on instrument detail pages.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<CorporateIssuerEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<CorporateIssuerEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/fund-issuer': {
    get: {
      /**
       * Specifically targets fund instruments (mutual funds, certain ETPs). This endpoint provides data on the legal fund management company (Fund Manager/UCITS ManCo) and essential regulatory documentation links (e.g., KIID/KID, prospectus PDFs). This is critical for meeting regulatory obligations and ensuring the client can access required legal information prior to trading funds.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<FundIssuerEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<FundIssuerEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/issuer-fundamentals': {
    get: {
      /**
       * Provides the comprehensive set of Key Figures (Growth, Profitability, Risk) for the underlying issuer. Each metric is delivered as a MetricSeries, which includes the latest reported value and a short trend history. This endpoint is central for building analytical views, screening tools, and the financial context cards displayed to end-users.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<IssuerFundamentalsEntity>>] | [404, NotFoundResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<IssuerFundamentalsEntity>>]
        | [404, NotFoundResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/fund-metrics': {
    get: {
      /**
       * Delivers a suite of portfolio-level quantitative metrics (e.g., Alpha, Beta, SRRI, Max Drawdown). Unlike corporate fundamentals, these metrics assess the fund's performance and risk relative to its market benchmark and are essential for sophisticated fund selection, comparison tools, and displaying regulatory risk indicators (SRRI).
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<FundMetricsEntity>>] | [404, NotFoundResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<FundMetricsEntity>>]
        | [404, NotFoundResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/security-trading': {
    get: {
      /**
       * Provides the static trading rules and operational context necessary for placing and executing orders for exchange-traded instruments (stocks, ETFs, bonds, etc.). This includes settlement details, trading restrictions, price tick size, and any mandatory disclosures. Developers need this endpoint to accurately build the trading interface and enforce regulatory constraints based on the specific venue (MIC).
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<SecurityTradingEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<SecurityTradingEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/fund-trading': {
    get: {
      /**
       * Provides the non-exchange-based operational rules required for processing mutual fund orders. This includes the daily order cutoff time, the frequency of NAV calculation, and the exact settlement timeline for subscriptions and redemptions. Essential for correctly informing the user about when their order will be executed and settled.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<FundTradingEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<FundTradingEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/orderbook': {
    get: {
      /**
       * Retrieves the best available bid and ask prices and associated volumes for the instrument from the primary trading venue. This information is crucial for displaying real-time market depth, calculating current liquidity, and determining the immediate cost of a trade (the spread). The optional OrderbookDepth parameter allows developers to specify how many levels of depth to retrieve.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @param {OrderbookDepth} [args.query] - Optional. Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<OrderbookEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & {
          params: InstrumentIdParam
          query?: QueryParams<OrderbookDepth>
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<OrderbookEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/latest-trades': {
    get: {
      /**
       * Provides a list of executed transactions, including the traded price, volume, and precise timestamp. This data is used to confirm recent market activity, track price movement after the last quote, and display the instrument's overall trading liquidity over a short time horizon.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @param {PageSize} [args.query] - Optional. Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<LatestTradesEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & {
          params: InstrumentIdParam
          query?: QueryParams<PageSize>
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<LatestTradesEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/history': {
    get: {
      /**
       * Retrieves time-series data necessary for generating candlestick charts and performing technical analysis for instruments traded on exchanges (stocks, ETFs, etc.). The data format is typically Open, High, Low, Close (OHLC) prices and volume, allowing developers to build detailed historical visualizations and backtesting tools for securities. The window for the history can be defined by the client.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @param {HistoryWindowParam} args.query - Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HistoryEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & {
          params: InstrumentIdParam
          query: QueryParams<HistoryWindowParam>
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<HistoryEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/fund-history': {
    get: {
      /**
       * Retrieves the time-series of historical Net Asset Values (NAV) for fund instruments (mutual funds). Unlike OHLC, fund prices typically represent a single calculated daily value. This data is used specifically to track the long-term performance and calculate returns for fund instruments where trading is based on daily calculated NAVs.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @param {HistoryWindowParam} args.query - Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<FundHistoryEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & {
          params: InstrumentIdParam
          query: QueryParams<HistoryWindowParam>
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<FundHistoryEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/performance': {
    get: {
      /**
       * Provides a dense set of aggregated statistics over standardized time horizons (e.g., 1m, YTD, 5y). This endpoint delivers performance metrics calculated based on closing price, absolute change, and percentage change, as well as price extremes (highs/lows) during those periods. Furthermore, it includes derived technical analysis metrics such as the RSI (Relative Strength Index), crucial for building advanced charting and screening features for technical traders.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<PerformanceEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<PerformanceEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/issuer-sustainability': {
    get: {
      /**
       * Retrieves sustainability metrics related to the issuer's corporate operations (e.g., the company that issued the stock or bond). This includes overall ESG risk ratings from providers, specific scores like the Carbon Reduction Ambition Score, and governance indicators. This endpoint is used for assessing the corporate behavior behind the security.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<IssuerSustainabilityEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<IssuerSustainabilityEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/issuer-taxonomy': {
    get: {
      /**
       * Retrieves data detailing the issuer's alignment with the EU Taxonomy regulation. This focuses on the corporate activities of the issuer, specifically detailing the percentage of revenue, CapEx, and OpEx that are considered Taxonomy-eligible and Taxonomy-aligned. This is a regulatory requirement for transparency on corporate climate transition efforts.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<IssuerTaxonomyEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<IssuerTaxonomyEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/portfolio-sustainability': {
    get: {
      /**
       * Provides portfolio-level sustainability data for collective investment schemes (funds, ETPs). The metrics are aggregated from the underlying holdings and include portfolio carbon intensity, controversial revenue exposures, and compliance with exclusion criteria. This is crucial for pre-contractual and periodic sustainability reporting (SFDR/MiFID II).
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<PortfolioSustainabilityEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<PortfolioSustainabilityEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/portfolio-taxonomy': {
    get: {
      /**
       * Provides the aggregated Taxonomy alignment data for the entire portfolio (funds, ETPs). This endpoint combines the underlying alignment data of the portfolio constituents into a single view, showing the weighted average alignment percentages. This is essential for fund managers and distributors to comply with regulatory disclosure requirements.
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<PortfolioTaxonomyEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<PortfolioTaxonomyEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/holdings': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<HoldingsEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<HoldingsEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/instruments/:id/fees': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {InstrumentIdParam} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<FeesEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse] | [429, TooManyRequestsResponse]>}
       */
      handler: (
        args: Req & { params: InstrumentIdParam },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<FeesEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
        | [429, TooManyRequestsResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/news': {
    get: {
      /**
       *
       * @param {Object} [args] - Optional. The arguments for the request.
       * @param {PageToken & PageSize & FilterByCountries & FilterByInstruments & FilterFrom & FilterTo & FilterByNewsTypes & FilterByNewsCategories} [args.query] - Optional. Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<NewsListEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse]>}
       */
      handler: (
        args?: Req & {
          query?: QueryParams<
            PageToken &
              PageSize &
              FilterByCountries &
              FilterByInstruments &
              FilterFrom &
              FilterTo &
              FilterByNewsTypes &
              FilterByNewsCategories
          >
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<NewsListEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/news/sources': {
    get: {
      /**
       *
       * @param {Object} [args] - Optional. The arguments for the request.
       * @param {FilterByCountries} [args.query] - Optional. Query parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<NewsSourceListEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse]>}
       */
      handler: (
        args?: Req & { query?: QueryParams<FilterByCountries> },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<NewsSourceListEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/news/:id': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {Object} args.params - Path parameters for the request.
       * @param {string} args.params.id
       * @returns {Promise<[200, APIResponse<PartiallySerialized<NewsArticleEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse]>}
       */
      handler: (
        args: Req & {
          params: {
            id: string
          }
        },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<NewsArticleEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/conversion-rates': {
    get: {
      /**
       * This short, non-paginated list represents the official rates used for converting prices and balances within the system (Source B).
       *
       * @returns {Promise<[200, APIResponse<PartiallySerialized<ConversionRateList>[]>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse]>}
       */
      handler: (
        args: Req,
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<ConversionRateList>[]>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/conversion-rates/:rateId': {
    get: {
      /**
       *
       * @param {Object} args - The arguments for the request.
       * @param {RateId} args.params - Path parameters for the request.
       * @returns {Promise<[200, APIResponse<PartiallySerialized<ConversionRateEntity>>] | [401, UnauthorizedResponse] | [403, ForbiddenResponse] | [404, NotFoundResponse]>}
       */
      handler: (
        args: Req & { params: RateId },
      ) => Promise<
        | [200, APIResponse<PartiallySerialized<ConversionRateEntity>>]
        | [401, UnauthorizedResponse]
        | [403, ForbiddenResponse]
        | [404, NotFoundResponse]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

export type TradeinsightVServer = APIServerDefinition & TradeinsightVServerPaths

export type TradeinsightVClient = Pick<BaseClient, 'get'> & {
  get: {
    /**
     * Combined view of status, system/process metrics, and readiness summary.
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HealthCheck_HealthSummary>>>}
     */
    (
      url: '/health',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HealthCheck_HealthSummary>>>
    /**
     * Basic health status.
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HealthCheck_Status>>>}
     */
    (
      url: '/health/ping',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HealthCheck_Status>>>
    /**
     * Liveness signal with system and process metrics.
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HealthCheck_Liveness>>>}
     */
    (
      url: '/health/live',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HealthCheck_Liveness>>>
    /**
     * Readiness including dependency checks and summary.
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HealthCheck_ReadinessPayload>>>}
     */
    (
      url: '/health/ready',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HealthCheck_ReadinessPayload>>>
    /**
     * This endpoint provides a comprehensive, paginated list of Market Identifier Codes (MICs) currently supported by the API. It's essential for Product Managers needing to know which trading venues and exchanges are available for the end-customer offering, allowing for dynamic selection and display of trading options.
     *
     * @param {string} url
     * @param {Object} [args] - Optional. The arguments for the request.
     * @param {PageSize & Page} [args.query] - Optional. Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<MarketList>>>}
     */
    (
      url: '/markets',
      args?: { query?: PageSize & Page },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<MarketList>>>
    /**
     * Retrieves static and operational details for a specific trading venue identified by its MIC. This includes the legal operating entity, trading hours, country of operation, and standardized market segments. Use this to display accurate regulatory and operational context when presenting a venue to a user.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {MIC} args.params.mic
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<MarketDetailsEntity>>>}
     */
    (
      url: '/markets/:mic',
      args: {
        params: {
          mic: Mic
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<MarketDetailsEntity>>>
    /**
     * This powerful endpoint allows users to filter, search, and screen the entire instrument universe. It's the primary tool for building search functionality, category views, and instrument lists for the end-user application. Developers can combine filtering by MIC, ISIN, country, and instrument type to precisely target the instruments tradable on specific platforms, ensuring the user only sees relevant products. Pagination and sorting are supported for efficient client-side rendering.
     *
     * @param {string} url
     * @param {Object} [args] - Optional. The arguments for the request.
     * @param {FilterByCountries & FilterByMICs & FilterByOperatingMICs & FilterByISINs & FilterByCurrencies & FilterByInstrumentTypes & FilterByInstrumentSubTypes & FilterByInstruments & SearchQuery & SortBy & SortOrder & BaseCurrency} [args.query] - Optional. Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<InstrumentList>>>}
     */
    (
      url: '/instruments',
      args?: {
        query?: FilterByCountries &
          FilterByMICs &
          FilterByOperatingMICs &
          FilterByISINs &
          FilterByCurrencies &
          FilterByInstrumentTypes &
          FilterByInstrumentSubTypes &
          FilterByInstruments &
          SearchQuery &
          SortBy &
          SortOrder &
          BaseCurrency
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<InstrumentList>>>
    /**
     * Retrieves the canonical record for a single instrument, providing all essential information in one call: name, identifiers, listing details, tradability status, and the current market price. Critically, this response also includes the links object, which acts as a dynamic roadmap to all related sub-data (e.g., fundamentals, trading rules, history) specific to that instrument type (Stock, Fund, or Derivative). Use this as the foundation for the instrument detail page.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {BaseCurrency} [args.query] - Optional. Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<InstrumentEntity>>>}
     */
    (
      url: '/instruments/:id',
      args: { params: InstrumentIdParam; query?: BaseCurrency },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<InstrumentEntity>>>
    /**
     * Retrieves the static core data for the corporate entity (or equivalent) that issued the security (e.g., stocks, corporate bonds, most ETFs). This includes the company's address, contact details, official identifiers (like LEI), and key management contacts (CEO, CFO). It provides the foundational identity context required for compliance, due diligence, and information display on instrument detail pages.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<CorporateIssuerEntity>>>}
     */
    (
      url: '/instruments/:id/issuer',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<CorporateIssuerEntity>>>
    /**
     * Specifically targets fund instruments (mutual funds, certain ETPs). This endpoint provides data on the legal fund management company (Fund Manager/UCITS ManCo) and essential regulatory documentation links (e.g., KIID/KID, prospectus PDFs). This is critical for meeting regulatory obligations and ensuring the client can access required legal information prior to trading funds.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<FundIssuerEntity>>>}
     */
    (
      url: '/instruments/:id/fund-issuer',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<FundIssuerEntity>>>
    /**
     * Provides the comprehensive set of Key Figures (Growth, Profitability, Risk) for the underlying issuer. Each metric is delivered as a MetricSeries, which includes the latest reported value and a short trend history. This endpoint is central for building analytical views, screening tools, and the financial context cards displayed to end-users.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<IssuerFundamentalsEntity>>>}
     */
    (
      url: '/instruments/:id/issuer-fundamentals',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<IssuerFundamentalsEntity>>>
    /**
     * Delivers a suite of portfolio-level quantitative metrics (e.g., Alpha, Beta, SRRI, Max Drawdown). Unlike corporate fundamentals, these metrics assess the fund's performance and risk relative to its market benchmark and are essential for sophisticated fund selection, comparison tools, and displaying regulatory risk indicators (SRRI).
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<FundMetricsEntity>>>}
     */
    (
      url: '/instruments/:id/fund-metrics',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<FundMetricsEntity>>>
    /**
     * Provides the static trading rules and operational context necessary for placing and executing orders for exchange-traded instruments (stocks, ETFs, bonds, etc.). This includes settlement details, trading restrictions, price tick size, and any mandatory disclosures. Developers need this endpoint to accurately build the trading interface and enforce regulatory constraints based on the specific venue (MIC).
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<SecurityTradingEntity>>>}
     */
    (
      url: '/instruments/:id/security-trading',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<SecurityTradingEntity>>>
    /**
     * Provides the non-exchange-based operational rules required for processing mutual fund orders. This includes the daily order cutoff time, the frequency of NAV calculation, and the exact settlement timeline for subscriptions and redemptions. Essential for correctly informing the user about when their order will be executed and settled.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<FundTradingEntity>>>}
     */
    (
      url: '/instruments/:id/fund-trading',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<FundTradingEntity>>>
    /**
     * Retrieves the best available bid and ask prices and associated volumes for the instrument from the primary trading venue. This information is crucial for displaying real-time market depth, calculating current liquidity, and determining the immediate cost of a trade (the spread). The optional OrderbookDepth parameter allows developers to specify how many levels of depth to retrieve.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {OrderbookDepth} [args.query] - Optional. Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<OrderbookEntity>>>}
     */
    (
      url: '/instruments/:id/orderbook',
      args: { params: InstrumentIdParam; query?: OrderbookDepth },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<OrderbookEntity>>>
    /**
     * Provides a list of executed transactions, including the traded price, volume, and precise timestamp. This data is used to confirm recent market activity, track price movement after the last quote, and display the instrument's overall trading liquidity over a short time horizon.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {PageSize} [args.query] - Optional. Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<LatestTradesEntity>>>}
     */
    (
      url: '/instruments/:id/latest-trades',
      args: { params: InstrumentIdParam; query?: PageSize },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<LatestTradesEntity>>>
    /**
     * Retrieves time-series data necessary for generating candlestick charts and performing technical analysis for instruments traded on exchanges (stocks, ETFs, etc.). The data format is typically Open, High, Low, Close (OHLC) prices and volume, allowing developers to build detailed historical visualizations and backtesting tools for securities. The window for the history can be defined by the client.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {HistoryWindowParam} args.query - Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HistoryEntity>>>}
     */
    (
      url: '/instruments/:id/history',
      args: { params: InstrumentIdParam; query: HistoryWindowParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HistoryEntity>>>
    /**
     * Retrieves the time-series of historical Net Asset Values (NAV) for fund instruments (mutual funds). Unlike OHLC, fund prices typically represent a single calculated daily value. This data is used specifically to track the long-term performance and calculate returns for fund instruments where trading is based on daily calculated NAVs.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {HistoryWindowParam} args.query - Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<FundHistoryEntity>>>}
     */
    (
      url: '/instruments/:id/fund-history',
      args: { params: InstrumentIdParam; query: HistoryWindowParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<FundHistoryEntity>>>
    /**
     * Provides a dense set of aggregated statistics over standardized time horizons (e.g., 1m, YTD, 5y). This endpoint delivers performance metrics calculated based on closing price, absolute change, and percentage change, as well as price extremes (highs/lows) during those periods. Furthermore, it includes derived technical analysis metrics such as the RSI (Relative Strength Index), crucial for building advanced charting and screening features for technical traders.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<PerformanceEntity>>>}
     */
    (
      url: '/instruments/:id/performance',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<PerformanceEntity>>>
    /**
     * Retrieves sustainability metrics related to the issuer's corporate operations (e.g., the company that issued the stock or bond). This includes overall ESG risk ratings from providers, specific scores like the Carbon Reduction Ambition Score, and governance indicators. This endpoint is used for assessing the corporate behavior behind the security.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<IssuerSustainabilityEntity>>>}
     */
    (
      url: '/instruments/:id/issuer-sustainability',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<IssuerSustainabilityEntity>>>
    /**
     * Retrieves data detailing the issuer's alignment with the EU Taxonomy regulation. This focuses on the corporate activities of the issuer, specifically detailing the percentage of revenue, CapEx, and OpEx that are considered Taxonomy-eligible and Taxonomy-aligned. This is a regulatory requirement for transparency on corporate climate transition efforts.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<IssuerTaxonomyEntity>>>}
     */
    (
      url: '/instruments/:id/issuer-taxonomy',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<IssuerTaxonomyEntity>>>
    /**
     * Provides portfolio-level sustainability data for collective investment schemes (funds, ETPs). The metrics are aggregated from the underlying holdings and include portfolio carbon intensity, controversial revenue exposures, and compliance with exclusion criteria. This is crucial for pre-contractual and periodic sustainability reporting (SFDR/MiFID II).
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<PortfolioSustainabilityEntity>>>}
     */
    (
      url: '/instruments/:id/portfolio-sustainability',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<PortfolioSustainabilityEntity>>>
    /**
     * Provides the aggregated Taxonomy alignment data for the entire portfolio (funds, ETPs). This endpoint combines the underlying alignment data of the portfolio constituents into a single view, showing the weighted average alignment percentages. This is essential for fund managers and distributors to comply with regulatory disclosure requirements.
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<PortfolioTaxonomyEntity>>>}
     */
    (
      url: '/instruments/:id/portfolio-taxonomy',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<PortfolioTaxonomyEntity>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<HoldingsEntity>>>}
     */
    (
      url: '/instruments/:id/holdings',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<HoldingsEntity>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {InstrumentIdParam} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<FeesEntity>>>}
     */
    (
      url: '/instruments/:id/fees',
      args: { params: InstrumentIdParam },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<FeesEntity>>>
    /**
     *
     * @param {string} url
     * @param {Object} [args] - Optional. The arguments for the request.
     * @param {PageToken & PageSize & FilterByCountries & FilterByInstruments & FilterFrom & FilterTo & FilterByNewsTypes & FilterByNewsCategories} [args.query] - Optional. Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<NewsListEntity>>>}
     */
    (
      url: '/news',
      args?: {
        query?: PageToken &
          PageSize &
          FilterByCountries &
          FilterByInstruments &
          FilterFrom &
          FilterTo &
          FilterByNewsTypes &
          FilterByNewsCategories
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<NewsListEntity>>>
    /**
     *
     * @param {string} url
     * @param {Object} [args] - Optional. The arguments for the request.
     * @param {FilterByCountries} [args.query] - Optional. Query parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<NewsSourceListEntity>>>}
     */
    (
      url: '/news/sources',
      args?: { query?: FilterByCountries },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<NewsSourceListEntity>>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {Object} args.params - Path parameters for the request.
     * @param {string} args.params.id
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<NewsArticleEntity>>>}
     */
    (
      url: '/news/:id',
      args: {
        params: {
          id: string
        }
      },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<NewsArticleEntity>>>
    /**
     * This short, non-paginated list represents the official rates used for converting prices and balances within the system (Source B).
     *
     * @param {string} url
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<ConversionRateList>[]>>}
     */
    (
      url: '/conversion-rates',
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<ConversionRateList>[]>>
    /**
     *
     * @param {string} url
     * @param {Object} args - The arguments for the request.
     * @param {RateId} args.params - Path parameters for the request.
     * @param {RequestOptions} [opts] - Optional.
     * @returns {Promise<APIResponse<Serialized<ConversionRateEntity>>>}
     */
    (
      url: '/conversion-rates/:rateId',
      args: { params: RateId },
      opts?: RequestOptions,
    ): Promise<APIResponse<Serialized<ConversionRateEntity>>>
  }
}
