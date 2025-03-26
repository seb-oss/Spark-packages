import { InstrumentPrice } from "./tickerMessage";

/**
 * @deprecated Use the Ticker type instead.
 */
export interface StockTicker {
	id: string;
	mic: string;
	isin: string;
	ticker: string;
	currencyCode: string;
	price: InstrumentPrice;
}

/**
 * @deprecated Use the TickerMessage type instead.
 */
export interface StockTickerMessage {
	tickers: StockTicker[];
}
