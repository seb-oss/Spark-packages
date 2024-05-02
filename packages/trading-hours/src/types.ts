export type SebMarket =
  | 'EQTB'
  | 'SSME'
  | 'XAMS'
  | 'XETR'
  | 'XHEL'
  | 'XPAR'
  | 'XSTO'

export type Holiday =
  | 'newYearsDay'
  | 'goodFriday'
  | 'epiphany'
  | 'easterMonday'
  | 'laborDay'
  | 'independenceDaySweden'
  | 'independenceDayFinland'
  | 'ascensionDay'
  | 'midsummerDay'
  | 'midsummerEve'
  | 'christmasEve'
  | 'christmasDay'
  | 'boxingDay'
  | 'newYearsEve'

type Hours = {
  openHour: number
  openMinute: number
  closeHour: number
  closeMinute: number
  irregularCloseHour?: number
  irregularCloseMinute?: number
}

export type OpeningHours = Record<SebMarket, Hours>
