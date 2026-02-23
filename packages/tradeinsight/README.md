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
// STO_SE0000108656_SEK_XSTO
```

### Parse ID

```javascript
const { type, baseCurrency, quoteCurrency } = parseId('FXS_USD_EUR')
console.log(type, baseCurrency, quoteCurrency)
// FOREX, USD, EUR
```
