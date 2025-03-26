import type { StockTickerMessage } from '../generated/stockticker'
import type { TickerMessage } from '../generated/tickerMessage'

/**
 * @deprecated Use TickersTopic instead
 */
export const StockTickerTopic = 'tradeinsight.stockticker'

/**
 * @deprecated Use TickersPubSubChannels instead
 */
export type StockTickerPubSubChannels = {
  [StockTickerTopic]: StockTickerMessage
}

export const TickersTopic = 'tradeinsight.tickers'
export type TickersPubSubChannels = {
  [TickersTopic]: TickerMessage
}
