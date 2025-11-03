import type { TickerMessage } from '../generated/tickerMessage'

export const TickersTopic = 'tradeinsight.tickers'
export type TickersPubSubChannels = {
  [TickersTopic]: TickerMessage
}
