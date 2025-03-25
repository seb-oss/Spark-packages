import type { StockTickerMessage } from '../generated/stockticker'

export const StockTickerTopic = 'tradeinsight.stockticker'
export type StockTickerPubSubChannels = {
  [StockTickerTopic]: StockTickerMessage
}
