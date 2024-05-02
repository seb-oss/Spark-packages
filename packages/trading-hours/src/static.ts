import type { OpeningHours } from './types'

export const openingHours: OpeningHours = {
  XSTO: {
    openHour: 9,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 30,
    irregularCloseHour: 13,
    irregularCloseMinute: 0,
  },
  EQTB: {
    openHour: 8,
    openMinute: 0,
    closeHour: 22,
    closeMinute: 0,
    irregularCloseHour: 20,
    irregularCloseMinute: 0,
  },
  XHEL: {
    openHour: 10,
    openMinute: 0,
    closeHour: 18,
    closeMinute: 25,
  },
  SSME: {
    openHour: 9,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 30,
    irregularCloseHour: 13,
    irregularCloseMinute: 0,
  },
  XPAR: {
    openHour: 9,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 30,
    irregularCloseHour: 14,
    irregularCloseMinute: 5,
  },
  XAMS: {
    openHour: 9,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 30,
    irregularCloseHour: 13,
    irregularCloseMinute: 55,
  },
  XETR: {
    openHour: 9,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 30,
  },
} as const
