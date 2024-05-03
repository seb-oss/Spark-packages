export type SebMarket =
  | 'EQTB'
  | 'MTAA'
  | 'SSME'
  | 'XAMS'
  | 'XBER'
  | 'XBRU'
  | 'XCSE'
  | 'XETR'
  | 'XHEL'
  | 'XLIS'
  | 'XLON'
  | 'XMAD'
  | 'XNGM'
  | 'XPAR'
  | 'XSAT'
  | 'XSTO'

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

export type OpeningHours = Record<SebMarket, Hours>
