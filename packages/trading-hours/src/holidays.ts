import { addDays, subDays } from 'date-fns'
import { openingHours } from './static'
import type { Holiday } from './types'
import {
  calculateMidsummerDay,
  christianHolidays,
  convertTime,
  independenceDays,
  marketHalfdays,
  marketHoliday,
  normalizeMarket,
  shortDate,
  staticHolidays,
} from './utils'

/**
 * Get holidays for a specific market and year
 * Data from:
 *
 * - https://www.tradinghours.com/
 * - https://www.nasdaqomxnordic.com/tradinghours
 * - https://www.avanza.se/aktier/oppettider-handelskalender.html
 * - https://www.nordnet.se/se/marknad/borsens-oppettider
 */
export function holidays(mic: string, year: number) {
  const market = normalizeMarket(mic)

  // Holidays that are the same every year
  const staticDates = staticHolidays(year)

  // Independence days
  const independenceDay = independenceDays(year)

  // Christian holidays
  const christian = christianHolidays(year)

  // Midsummer
  const midsummerDay = calculateMidsummerDay(year)
  const midsummerEve = shortDate(subDays(midsummerDay, 1))

  // Market specific holidays
  const marketSpecificHoliday = marketHoliday(market, year)

  switch (market) {
    case 'XSAT':
    case 'XNGM':
    case 'SSME':
    case 'XSTO':
    case 'NSME':
      return [
        staticDates.newYearsDay,
        christian.epiphany,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        christian.ascensionDay,
        independenceDay.sweden,
        midsummerEve,
        staticDates.christmasEve,
        staticDates.christmasDay,
        staticDates.boxingDay,
        staticDates.newYearsEve,
      ]

    case 'XLIS':
    case 'XAMS':
    case 'XPAR':
    case 'XMAD':
    case 'XBRU':
      return [
        staticDates.newYearsDay,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        staticDates.christmasDay,
        staticDates.boxingDay,
      ]

    case 'XLON':
      return [
        staticDates.newYearsDay,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.christmasDay,
        staticDates.boxingDay,
        ...marketSpecificHoliday,
      ].sort((a, b) => a.localeCompare(b))

    case 'XETR':
      return [
        staticDates.newYearsDay,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        staticDates.christmasEve,
        staticDates.christmasDay,
        staticDates.boxingDay,
        staticDates.newYearsEve,
      ]

    case 'XBER':
    case 'EQTB':
      return [
        staticDates.newYearsDay,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        staticDates.christmasEve,
        staticDates.christmasDay,
        staticDates.boxingDay,
        staticDates.newYearsEve,
      ]

    case 'XHEL':
    case 'FSME':
      return [
        staticDates.newYearsDay,
        christian.epiphany,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        christian.ascensionDay,
        midsummerEve,
        independenceDay.finland,
        staticDates.christmasEve,
        staticDates.christmasDay,
        staticDates.boxingDay,
        staticDates.newYearsEve,
      ]

    case 'XCSE':
    case 'DSME':
      return [
        staticDates.newYearsDay,
        christian.beforeGoodFriday,
        christian.goodFriday,
        christian.easterMonday,
        christian.ascensionDay,
        christian.pentecostMonday,
        independenceDay.denmark,
        staticDates.christmasEve,
        staticDates.christmasDay,
        staticDates.boxingDay,
        staticDates.newYearsEve,
        ...marketSpecificHoliday,
      ].sort((a, b) => a.localeCompare(b))

    case 'MTAA':
      return [
        staticDates.newYearsDay,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        christian.assumptionDay,
        staticDates.christmasEve,
        staticDates.christmasDay,
        staticDates.boxingDay,
        staticDates.newYearsEve,
      ]

    default:
      return []
  }
}

/**
 * Get half days for a specific market and year. In Sweden, half days are
 * common before holidays.
 */
export function halfdays(mic: string, year: number) {
  const market = normalizeMarket(mic)
  const staticDates = staticHolidays(year)
  const {
    beforeGoodFriday,
    beforeEpiphany,
    beforeAllSaintsDay,
    beforeAscensionDay,
    ascensionDay,
    pentecostMonday,
  } = christianHolidays(year)
  const independenceDay = independenceDays(year)
  const beforeChristmasEve = shortDate(subDays(staticDates.christmasEve, 1))
  const beforeNewYearsEve = shortDate(subDays(staticDates.newYearsEve, 1))

  const specialMarketHalfdays = marketHalfdays(market, year)

  switch (market) {
    case 'XSAT':
    case 'XNGM':
    case 'SSME':
    case 'XSTO':
    case 'NSME':
      return [
        // Before Epiphany | Trettondagsafton
        // 6th of January
        beforeEpiphany,
        // Before Good Friday | Långfredagen
        // 3 days before Easter Sunday
        beforeGoodFriday,
        // Walpurgis Night | Valborgsmässoafton
        // 30th of April
        `${year}-04-30`,
        // Before Ascension Day | Kristi himmelsfärdsdag
        // 39 days after Easter Sunday
        beforeAscensionDay,
        // Before All Saints' Day | Alla helgons dag
        // Saturday between 31st of October and 6th of November
        beforeAllSaintsDay,
      ]

    case 'XLIS':
    case 'XMAD':
    case 'XPAR':
    case 'XBRU':
    case 'XAMS':
    case 'XLON':
      return [staticDates.christmasEve, staticDates.newYearsEve]

    case 'XBER':
    case 'EQTB':
      return [
        ascensionDay,
        pentecostMonday,
        independenceDay.germany,
        // TODO: This has different irregular hours
        beforeNewYearsEve,
      ]

    case 'MTAA':
      return [
        beforeGoodFriday,
        beforeAllSaintsDay,
        beforeChristmasEve,
        beforeNewYearsEve,
        ...specialMarketHalfdays,
      ].sort((a, b) => a.localeCompare(b))

    default:
      return []
  }
}

/**
 * Check if a given date is a holiday for a specific market
 */
export function isHoliday(mic: string, date: Date) {
  if (date.getDay() === 0 || date.getDay() === 6) {
    return true
  }

  return holidays(mic, date.getFullYear()).includes(shortDate(date))
}

/**
 * Check if a given date is a half day for a specific market
 */
export function isHalfday(mic: string, date: Date) {
  return halfdays(mic, date.getFullYear()).includes(shortDate(date))
}

/**
 * Check if a specific market is open.
 * Takes into account holidays and half days
 */
export function isOpen(mic: string) {
  const market = normalizeMarket(mic)
  const now = new Date()
  const {
    openHour,
    openMinute,
    closeHour,
    closeMinute,
    irregularCloseHour,
    irregularCloseMinute,
    special,
  } = openingHours[market]

  if (isHoliday(market, now)) {
    return false
  }

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentSeconds = now.getSeconds()

  const timeOfDay = currentHour * 60 + currentMinute + currentSeconds / 60
  const openTime = openHour * 60 + openMinute
  let closeTime = isHalfday(market, now)
    ? (irregularCloseHour ?? 0) * 60 + (irregularCloseMinute ?? 0)
    : closeHour * 60 + closeMinute

  if (market === 'EQTB' || market === 'XBER') {
    const isDayBeforeNewYearsEve =
      whichHoliday(market, addDays(now, 1)) === 'newYearsEve'

    if (isDayBeforeNewYearsEve && special?.newYearsEve) {
      closeTime =
        special.newYearsEve.closeHour * 60 + special.newYearsEve.closeMinute
    }
  }

  const isBeforeOpeningHours = timeOfDay < openTime
  const isAfterClosingHours = closeTime <= timeOfDay

  return !isBeforeOpeningHours && !isAfterClosingHours
}

/**
 * Format opening hours for a specific market
 */
export function formatOpeningHours(mic: string) {
  const market = normalizeMarket(mic)
  const now = new Date()
  const {
    openHour,
    openMinute,
    closeHour,
    closeMinute,
    irregularCloseMinute,
    irregularCloseHour,
    special,
  } = openingHours[market]

  const open = convertTime(openHour, openMinute)
  const close = convertTime(closeHour, closeMinute)

  if (isHalfday(market, now)) {
    let irregularClose = convertTime(
      irregularCloseHour ?? 0,
      irregularCloseMinute ?? 0
    )

    if (market === 'EQTB' || market === 'XBER') {
      const isDayBeforeNewYearsEve =
        whichHoliday(market, addDays(now, 1)) === 'newYearsEve'

      if (isDayBeforeNewYearsEve && special?.newYearsEve) {
        irregularClose = convertTime(
          special.newYearsEve.closeHour,
          special.newYearsEve.closeMinute
        )
      }
    }

    return `${open} – ${irregularClose}`
  }

  return `${open} – ${close}`
}

/**
 * Get the holiday for a specific date.
 * Returns a TypeScript union value which is useful if you need to support
 * multiple languages. Then the consumer can determine what to display to the user.
 */
export function whichHoliday(mic: string, date: Date): Holiday | null {
  const market = normalizeMarket(mic)

  if (!isHoliday(market, date) && !isHalfday(market, date)) {
    return null
  }

  const formattedDate = shortDate(date)
  const year = date.getFullYear()
  const staticDates = staticHolidays(year)
  const christian = christianHolidays(year)
  const independenceDay = independenceDays(year)
  const midsummerDay = calculateMidsummerDay(year)
  const midsummerEve = shortDate(subDays(midsummerDay, 1))
  const specialMarketHolidays = marketHoliday(market, year)
  const specialMarketHalfdays = marketHalfdays(market, year)

  const holidays: Record<string, Holiday> = {
    [midsummerEve]: 'midsummerEve',
    [shortDate(midsummerDay)]: 'midsummerDay',
  }

  for (const [holiday, date] of Object.entries(staticDates)) {
    holidays[date] = holiday as Holiday
  }

  for (const [holiday, date] of Object.entries(christian)) {
    holidays[date] = holiday as Holiday
  }

  for (const [country, date] of Object.entries(independenceDay)) {
    const capitalizedCountry =
      country.charAt(0).toUpperCase() + country.slice(1)

    holidays[date] = `independenceDay${capitalizedCountry}` as Holiday
  }

  if (specialMarketHolidays.includes(formattedDate)) {
    if (market === 'XLON') {
      return 'bankHoliday'
    }
  }

  if (specialMarketHalfdays.includes(formattedDate)) {
    if (market === 'MTAA') {
      return 'noTAH'
    }
  }

  return holidays[formattedDate] ?? null
}

export function marketOpeningHours(mic: string, date: Date) {
  const market = normalizeMarket(mic)
  const hours = openingHours[market]

  if (!hours) {
    return null
  }

  if (isHalfday(market, date)) {
    return {
      openHour: hours.openHour,
      openMinute: hours.openMinute,
      closeHour: hours.irregularCloseHour ?? 0,
      closeMinute: hours.irregularCloseMinute ?? 0,
    }
  }

  return {
    openHour: hours.openHour,
    openMinute: hours.openMinute,
    closeHour: hours.closeHour,
    closeMinute: hours.closeMinute,
  }
}
