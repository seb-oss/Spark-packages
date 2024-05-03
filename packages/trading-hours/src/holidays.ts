import { addDays, subDays } from 'date-fns'
import { openingHours } from './static'
import type { Holiday, SebMarket } from './types'
import {
  calculateMidsummerDay,
  christianHolidays,
  convertTime,
  independenceDays,
  marketHoliday,
  shortDate,
  staticHolidays,
} from './utils'

/**
 * Get holidays for a specific market and year
 * Data from:
 *
 * - https://www.tradinghours.com/
 * - https://www.nasdaqomxnordic.com/tradinghours
 */
export function holidays(mic: SebMarket, year: number) {
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
  const marketSpecificHoliday = marketHoliday(mic, year)

  switch (mic) {
    case 'XSAT':
    case 'XNGM':
    case 'SSME':
    case 'XSTO':
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

    case 'XAMS':
      return [
        staticDates.newYearsDay,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        staticDates.christmasDay,
        staticDates.boxingDay,
      ]

    case 'XPAR':
      return [
        staticDates.newYearsDay,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        staticDates.christmasDay,
        staticDates.boxingDay,
      ]

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

    case 'XMAD':
      return [
        staticDates.newYearsDay,
        christian.goodFriday,
        christian.easterMonday,
        staticDates.laborDay,
        staticDates.christmasDay,
        staticDates.boxingDay,
      ]

    case 'XCSE':
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

    default:
      return []
  }
}

/**
 * Get half days for a specific market and year. In Sweden, half days are
 * common before holidays.
 */
export function halfdays(mic: SebMarket, year: number) {
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
  const beforeNewYearsEve = shortDate(subDays(staticDates.newYearsEve, 1))

  switch (mic) {
    case 'XSAT':
    case 'XNGM':
    case 'SSME':
    case 'XSTO':
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

    case 'XAMS':
      return [staticDates.christmasEve, staticDates.newYearsEve]

    case 'XPAR':
      return [staticDates.christmasEve, staticDates.newYearsEve]

    case 'XMAD':
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

    default:
      return []
  }
}

/**
 * Check if a given date is a holiday for a specific market
 */
export function isHoliday(mic: SebMarket, date: Date) {
  if (date.getDay() === 0 || date.getDay() === 6) {
    return true
  }

  return holidays(mic, date.getFullYear()).includes(shortDate(date))
}

/**
 * Check if a given date is a half day for a specific market
 */
export function isHalfday(mic: SebMarket, date: Date) {
  return halfdays(mic, date.getFullYear()).includes(shortDate(date))
}

/**
 * Check if a specific market is open.
 * Takes into account holidays and half days
 */
export function isOpen(mic: SebMarket) {
  const now = new Date()
  const {
    openHour,
    openMinute,
    closeHour,
    closeMinute,
    irregularCloseHour,
    irregularCloseMinute,
    special,
  } = openingHours[mic]

  if (isHoliday(mic, now)) {
    return false
  }

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentSeconds = now.getSeconds()

  const timeOfDay = currentHour * 60 + currentMinute + currentSeconds / 60
  const openTime = openHour * 60 + openMinute
  let closeTime = isHalfday(mic, now)
    ? (irregularCloseHour ?? 0) * 60 + (irregularCloseMinute ?? 0)
    : closeHour * 60 + closeMinute

  if (mic === 'EQTB' || mic === 'XBER') {
    const isDayBeforeNewYearsEve =
      whichHoliday(mic, addDays(now, 1)) === 'newYearsEve'

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
export function formatOpeningHours(mic: SebMarket) {
  const now = new Date()
  const {
    openHour,
    openMinute,
    closeHour,
    closeMinute,
    irregularCloseMinute,
    irregularCloseHour,
    special,
  } = openingHours[mic]

  const open = convertTime(openHour, openMinute)
  const close = convertTime(closeHour, closeMinute)

  if (isHalfday(mic, now)) {
    let irregularClose = convertTime(
      irregularCloseHour ?? 0,
      irregularCloseMinute ?? 0
    )

    if (mic === 'EQTB' || mic === 'XBER') {
      const isDayBeforeNewYearsEve =
        whichHoliday(mic, addDays(now, 1)) === 'newYearsEve'

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
export function whichHoliday(mic: SebMarket, date: Date): Holiday | null {
  if (!isHoliday(mic, date)) {
    return null
  }

  const formattedDate = shortDate(date)
  const year = date.getFullYear()
  const staticDates = staticHolidays(year)
  const christian = christianHolidays(year)
  const independenceDay = independenceDays(year)
  const midsummerDay = calculateMidsummerDay(year)
  const midsummerEve = shortDate(subDays(midsummerDay, 1))

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

  return holidays[formattedDate] ?? null
}

export function marketOpeningHours(mic: SebMarket, date: Date) {
  const market = openingHours[mic]

  if (!market) {
    return null
  }

  if (isHalfday(mic, date)) {
    return {
      openHour: market.openHour,
      openMinute: market.openMinute,
      closeHour: market.irregularCloseHour ?? 0,
      closeMinute: market.irregularCloseMinute ?? 0,
    }
  }

  return {
    openHour: market.openHour,
    openMinute: market.openMinute,
    closeHour: market.closeHour,
    closeMinute: market.closeMinute,
  }
}
