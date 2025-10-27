export const createStockId = ({
  isin,
  mic,
  currency,
}: {
  isin: string
  currency: string
  mic: string
}) => `STOCK-${isin}_${mic}_${currency}`.toUpperCase()

/**
 * Create an ID for a FOREX instrument, i.e. a currency relationship.
 * The structure matches a currency pair:
 *
 * Base currency / quote currency = Exchange rate
 *
 * @see https://en.wikipedia.org/wiki/Currency_pair
 * @example
 * EUR/USD = 1.45
 * This means a person would need 1.45 US dollars to purchase one Euro.
 */
export const createForexId = ({
  quoteCurrency,
  baseCurrency,
}: {
  baseCurrency: string
  quoteCurrency: string
}) => `FOREX-${baseCurrency}_${quoteCurrency}`.toUpperCase()

export const createIndexId = ({ ticker }: { ticker: string }) =>
  `INDEX-${ticker}`.toUpperCase()
