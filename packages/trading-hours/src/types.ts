export type SebMarket =
  | 'EQTB'
  | 'SSME'
  | 'XAMS'
  | 'XBER'
  | 'XCSE'
  | 'XETR'
  | 'XHEL'
  | 'XMAD'
  | 'XNGM'
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
  special?: Partial<Record<Holiday, Hours>>
}

export type OpeningHours = Record<SebMarket, Hours>
