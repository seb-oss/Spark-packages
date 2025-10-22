export const parseId = (
  id: string
): {
  type: 'STOCK' | 'FOREX'
  isin?: string
  mic?: string
  currency?: string
  baseCurrency?: string
  quoteCurrency?: string
} => {
  const [type, ...rest] = id.split('-')
  const [first, second, third] = rest.join('-').split(';')

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

  throw new Error('Invalid type')
}
