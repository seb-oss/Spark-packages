export const HOLIDAYS = [
  'ascensionDay',
  'assumptionDay',
  'bankHoliday',
  'beforeAllSaintsDay',
  'beforeAscensionDay',
  'beforeEpiphany',
  'beforeGoodFriday',
  'boxingDay',
  'christmasDay',
  'christmasEve',
  'easterMonday',
  'epiphany',
  'goodFriday',
  'independenceDayDenmark',
  'independenceDayFinland',
  'independenceDayGermany',
  'independenceDaySweden',
  'laborDay',
  'midsummerDay',
  'midsummerEve',
  'newYearsDay',
  'newYearsEve',
  'noTAH',
  'pentecost',
  'pentecostMonday',
] as const

export type Holiday = (typeof HOLIDAYS)[number]

type Hours = {
  openHour: number
  openMinute: number
  closeHour: number
  closeMinute: number
  irregularCloseHour?: number
  irregularCloseMinute?: number
  special?: Partial<Record<Holiday, Hours>>
}

export type OpeningHours = Record<string, Hours>
