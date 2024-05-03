import { addDays, subDays } from 'date-fns'
import type { SebMarket } from './types'

const formatter = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'short',
})

export function shortDate(date: Date) {
  return formatter.format(date)
}

// Anonymous Gregorian algorithm
function calculateEasterSunday(year: number) {
  const f = Math.floor
  // Golden Number - 1
  const G = year % 19
  const C = f(year / 100)
  // Epact
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30
  // Number of days from 21 March to the Paschal full moon
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11))
  // Weekday for the Paschal full moon
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
  // Number of days from 21 March to the Sunday on or before the Paschal full moon
  const L = I - J
  // Month
  const m = 3 + f((L + 40) / 44)
  // Day
  const d = L + 28 - 31 * f(m / 4)

  return new Date(year, m - 1, d)
}

// Saturday between 19th and 26th of June
export function calculateMidsummerDay(year: number) {
  const date = new Date(year, 5, 20) // 20th of June

  while (date.getDay() !== 6) {
    // 6 is Saturday
    date.setDate(date.getDate() + 1)
  }

  return date
}

// Saturday between 31st of October and 6th of November
function calculateAllSaintsDay(year: number) {
  const date = new Date(year, 10, 1) // 1st November

  while (date.getDay() !== 6) {
    // 6 is for Saturday
    date.setDate(date.getDate() + 1)
  }

  return date
}

export function christianHolidays(year: number) {
  const easterSunday = calculateEasterSunday(year)

  // Epiphany
  const epiphany = new Date(year, 0, 6)
  const beforeEpiphany = shortDate(subDays(epiphany, 1))

  // Good friday
  const goodFriday = subDays(easterSunday, 2)
  const beforeGoodFriday = shortDate(subDays(goodFriday, 1))

  // Easter Monday
  const easterMonday = addDays(easterSunday, 1)
  const ascensionDay = addDays(easterSunday, 39)

  // Ascension Day
  const beforeAscensionDay = shortDate(subDays(ascensionDay, 1))

  // All Saints' Day
  const allSaintsDay = calculateAllSaintsDay(year)
  const beforeAllSaintsDay = shortDate(subDays(allSaintsDay, 1))

  // Pentecost
  const pentecost = addDays(easterSunday, 49)
  const pentecostMonday = addDays(pentecost, 1)

  return {
    ascensionDay: shortDate(ascensionDay),
    assumptionDay: `${year}-08-15`,
    beforeAllSaintsDay,
    beforeAscensionDay,
    beforeEpiphany,
    beforeGoodFriday,
    easterMonday: shortDate(easterMonday),
    epiphany: shortDate(epiphany),
    goodFriday: shortDate(goodFriday),
    pentecost: shortDate(pentecost),
    pentecostMonday: shortDate(pentecostMonday),
  }
}

export function staticHolidays(year: number) {
  return {
    newYearsDay: `${year}-01-01`,
    laborDay: `${year}-05-01`,
    christmasEve: `${year}-12-24`,
    christmasDay: `${year}-12-25`,
    boxingDay: `${year}-12-26`,
    newYearsEve: `${year}-12-31`,
  }
}

export function independenceDays(year: number) {
  return {
    denmark: `${year}-06-05`,
    germany: `${year}-10-03`,
    finland: `${year}-12-06`,
    sweden: `${year}-06-06`,
  }
}

export function marketHoliday(mic: SebMarket, year: number) {
  switch (mic) {
    case 'XCSE':
      switch (year) {
        case 2024:
          return ['2024-05-10']
        default:
          return []
      }
    case 'XLON':
      switch (year) {
        case 2024:
          return ['2024-05-06', '2024-05-27', '2024-08-26']
        default:
          return []
      }
    default:
      return []
  }
}

export function marketHalfdays(mic: SebMarket, year: number) {
  const industryVacation = Array.from({ length: 31 }, (_, i) => i + 1).map(
    (d) => `${year}-08-${d.toString().padStart(2, '0')}`
  )

  const firstWeekOfJanauary = []

  // Skips New Year's Day
  for (let i = 2; i <= 5; i++) {
    const day = i.toString().padStart(2, '0')
    firstWeekOfJanauary.push(`${year}-01-${day}`)
  }

  switch (mic) {
    case 'MTAA':
      switch (year) {
        case 2024:
          return [
            ...firstWeekOfJanauary,
            '2024-04-25',
            '2024-04-26',
            // Don't include Assumption Day as it's a full holiday
            ...industryVacation.filter((d) => d !== '2024-08-15'),
            '2024-12-27',
          ]
        default:
          return []
      }
    default:
      return []
  }
}

export function convertTime(hour: number, minute: number) {
  const formattedHour = hour.toString().padStart(2, '0')
  const formattedMinute = minute.toString().padStart(2, '0')

  return `${formattedHour}:${formattedMinute}`
}
