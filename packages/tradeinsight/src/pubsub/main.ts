import type { TickerMessage } from '../generated/tickerMessage.js'

export const TickersTopic = 'tradeinsight.tickers'
export type TickersPubSubChannels = {
  [TickersTopic]: TickerMessage
}
