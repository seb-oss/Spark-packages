# `@sebspark/performance`

## Description
Calculates portfolio performance metrics including P/L, TWR, CAGR, and AR. Each metric provides unique insights:

- **P/L (Profit/Loss)**: Reflects the absolute gain or loss in the portfolio, capturing both realized and unrealized profits.
- **TWR (Time-Weighted Return)**: Measures the portfolio's compound growth rate, eliminating the impact of external cash flows.
- **CAGR (Compound Annual Growth Rate)**: Indicates the mean annual growth rate of an investment, assuming reinvestment of returns.
- **AR (Average Return)**: Calculates the simple average of periodic returns, offering a straightforward assessment of performance over time.


## Use
Install via npm or yarn:

**npm:**
```sh
npm install @sebspark/performance
```

**yarn:**
```sh
yarn add @sebspark/performance
```

### Example Usage
Import and use in your project:

```typescript
import { calculatePerformance, PerformanceCalculationInput } from '@sebspark/performance'

// Detailed portfolio data
const portfolioData: PerformanceCalculationInput = {
  initialValue: { total: 10000, without_cash: 9500 },
  endingValue: { total: 12000, without_cash: 11500 },
  cashFlows: [
    { date: '2023-01-15', amount: 500, investment_related: true },  // Additional investment
    { date: '2023-02-10', amount: 300, investment_related: false }, // Dividend received
    { date: '2023-03-01', amount: -200, investment_related: true }, // Partial withdrawal for investment
  ],
  transactions: [
    { date: '2023-01-20', type: 'buy', amount: 100, price: 50 },   // Bought shares
    { date: '2023-02-15', type: 'sell', amount: 50, price: 55 },   // Sold shares
  ],
  periodicValues: [
    { date: '2023-01-01', total: 10000, without_cash: 9500 },
    { date: '2023-02-01', total: 10500, without_cash: 10000 },
    { date: '2023-03-01', total: 11000, without_cash: 10500 },
    { date: '2023-04-01', total: 12000, without_cash: 11500 },
  ],
  startDate: '2023-01-01',
  endDate: '2023-04-01',
}

// Calculate and log the portfolio performance
const performance = calculatePerformance(portfolioData)
console.log(performance)

/*
  {
    PL: { total: 2000, without_cash: 2000 },
    TWR: { total: 0.2, without_cash: 0.21 },
    CAGR: { total: 0.2, without_cash: 0.21 },
    AR: { total: 0.2, without_cash: 0.21 },
  }
*/
```
