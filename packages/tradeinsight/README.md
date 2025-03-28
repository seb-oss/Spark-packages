# `@sebspark/tradeinsight`

TradeInsight client library with helpers for creating/parsing instrument IDs and consuming ticker feeds.

## Instrument IDs

### Create ID

```javascript
const isin = 'SE0000108656'
const mic = 'XSTO'
const currency = 'SEK'
const id = createStockId({ isin, mic, currency })

console.log(id)
// STOCK-SE0000108656;XSTO;SEK
```

### Parse ID

```javascript
const { type, fromCurrency, toCurrency } = parseId('FOREX-USD;EUR')
console.log(type, fromCurrency, toCurrency)
// FOREX, USD, EUR
```
