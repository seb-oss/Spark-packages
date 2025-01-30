import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import * as time from './time'

describe('time', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime('2025-01-30 12:00:00')
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('seconds return correct number of milliseconds', () => {
    expect(time.seconds(5)).toEqual(5000)
  })
  test('minutes return correct number of milliseconds', () => {
    expect(time.minutes(5)).toEqual(300000)
  })
  test('hours return correct number of milliseconds', () => {
    expect(time.hours(5)).toEqual(18000000)
  })
  test('days return correct number of milliseconds', () => {
    expect(time.days(5)).toEqual(432000000)
  })
  test('weeks return correct number of milliseconds', () => {
    expect(time.weeks(5)).toEqual(3024000000)
  })
  test('today(16, 1, 1) returns today ad 16:01:01 UTC', () => {
    expect(time.today(16, 1, 1).toISOString()).toEqual(
      '2025-01-30T16:01:01.000Z'
    )
  })
  test('tomorrow(16, 1, 1) returns tomorrow ad 16:01:01 UTC', () => {
    expect(time.tomorrow(16, 1, 1).toISOString()).toEqual(
      '2025-01-31T16:01:01.000Z'
    )
  })
})
