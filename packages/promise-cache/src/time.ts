import { add, sub } from 'date-fns'

export { add, sub }

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
export const WEEK = 7 * DAY

export const seconds = (num: number) => num * SECOND
export const minutes = (num: number) => num * MINUTE
export const hours = (num: number) => num * HOUR
export const days = (num: number) => num * DAY
export const weeks = (num: number) => num * WEEK

export const today = (hours = 0, minutes = 0, seconds = 0) => {
  const local = new Date()
  const utc = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
    hours,
    minutes,
    seconds
  )
  return new Date(utc)
}

export const tomorrow = (hours = 0, minutes = 0, seconds = 0) =>
  add(today(hours, minutes, seconds), { days: 1 })
