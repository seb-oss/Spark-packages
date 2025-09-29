export const createStockId = ({
  isin,
  mic,
  currency,
}: {
  isin: string
  currency: string
  mic: string
}) => `STOCK-${isin};${mic};${currency}`.toUpperCase()

export const createForexId = ({
  fromCurrency,
  toCurrency,
}: {
  toCurrency: string
  fromCurrency: string
}) => `FOREX-${toCurrency};${fromCurrency}`.toUpperCase()
