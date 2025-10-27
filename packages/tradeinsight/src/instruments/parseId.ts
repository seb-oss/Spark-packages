type StockId = {
  type: 'STOCK'
  isin: string
  mic: string
  currency: string
}

type ForexId = {
  type: 'FOREX'
  baseCurrency: string
  quoteCurrency: string
}

type IndexId = {
  type: 'INDEX'
  ticker: string
}

export const parseId = (id: string): StockId | ForexId | IndexId => {
  const [type, ...rest] = id.split('-')
  const [first, second, third] = rest.join().split('_')

  if (type === 'STOCK') {
    if (!second) {
      throw new Error('Missing MIC')
    }

    if (!third) {
      throw new Error('Missing currency')
    }

    return {
      type,
      isin: first,
      mic: second,
      currency: third,
    }
  }

  if (type === 'FOREX') {
    if (!first) {
      throw new Error('Missing baseCurrency')
    }

    if (!second) {
      throw new Error('Missing quoteCurrency')
    }

    return {
      type,
      baseCurrency: first,
      quoteCurrency: second,
    }
  }

  if (type === 'INDEX') {
    if (!first) {
      throw new Error('Missing ticker')
    }

    return {
      type,
      ticker: first,
    }
  }

  throw new Error('Invalid type')
}
