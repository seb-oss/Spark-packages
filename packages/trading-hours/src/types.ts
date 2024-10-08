export type Holiday =
  | 'ascensionDay'
  | 'assumptionDay'
  | 'bankHoliday'
  | 'boxingDay'
  | 'christmasDay'
  | 'christmasEve'
  | 'easterMonday'
  | 'epiphany'
  | 'goodFriday'
  | 'independenceDayFinland'
  | 'independenceDaySweden'
  | 'laborDay'
  | 'midsummerDay'
  | 'midsummerEve'
  | 'newYearsDay'
  | 'newYearsEve'
  | 'noTAH'

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
