# `@sebspark/trading-hours`

Find trading hours of a market, when it&#x27;s closed for holidays, or when it&#x27;s only open for part of the day.

## API

### holidays

```typescript
holidays(mic: SebMarket, year: number): Array<string>
```

Return a list of holidays for the provided market and year. The list contains dates formatted as ISO 8601 dates (YYYY-MM-DD).

### halfdays

```typescript
halfdays(mic: SebMarket, year: number): Array<string>
```

Similar to `holidays`, but for half trading days. In Sweden, these are common the day before a holiday, but they also occur in other markets, for example around Christmas.

### isHoliday

```typescript
isHoliday(mic: SebMarket, date: Date): boolean
```

Check if the provided date is a holiday on the market. Saturday and Sunday are always considered holidays.

### isHalfday

```typescript
isHalfday(mic: SebMarket, date: Date): boolean
```

Similar to `isHoliday`, but for half trading days.

### isOpen

```typescript
isOpen(mic: SebMarket): boolean
```

Checks if the market is open. This takes into account holidays, half trading days, and opening hours.

### formatOpeningHours

```typescript
formatOpeningHours(mic: SebMarket): string
```

Returns a formatted string of the opening hours of the market. For example, `09:00 - 17:30` for `XSTO`. Takes into account half trading days and returns any irregular opening hours.

### whichHoliday

```typescript
whichHoliday(mic: SebMarket, date: Date): Holiday | null
```

Checks what holiday, if any, the provided date is. The return types is provided as a TypeScript union instead of the actual name. This way the consumer can choose what to display, which is useful for multilanguage applications.

## Types

```typescript
export type SebMarket =
  | "EQTB"
  | "SSME"
  | "XAMS"
  | "XETR"
  | "XHEL"
  | "XPAR"
  | "XSTO";

export type Holiday =
  | "ascensionDay"
  | "boxingDay"
  | "christmasDay"
  | "christmasEve"
  | "easterMonday"
  | "epiphany"
  | "goodFriday"
  | "independenceDayFinland"
  | "independenceDaySweden"
  | "laborDay"
  | "midsummerDay"
  | "midsummerEve"
  | "newYearsDay"
  | "newYearsEve";
```
