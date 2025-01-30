export { add } from 'date-fns'

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
