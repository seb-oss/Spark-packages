import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  formatOpeningHours,
  halfdays,
  holidays,
  isHalfday,
  isHoliday,
  isOpen,
  marketOpeningHours,
  whichHoliday,
} from '../holidays.js'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('#holidays', () => {
  test.each(['XSTO', 'SSME', 'XNGM'] as const)('%s', (mic) => {
    expect(holidays(mic, 2024)).toEqual([
      '2024-01-01',
      '2024-01-06',
      '2024-03-29',
      '2024-04-01',
      '2024-05-01',
      '2024-05-09',
      '2024-06-06',
      '2024-06-21',
      '2024-12-24',
      '2024-12-25',
      '2024-12-26',
      '2024-12-31',
    ])
  })

  test.each(['XAMS', 'XLIS', 'XPAR', 'XMAD', 'XBRU'] as const)('%s', (mic) => {
    expect(holidays(mic, 2024)).toEqual([
      '2024-01-01',
      '2024-03-29',
      '2024-04-01',
      '2024-05-01',
      '2024-12-25',
      '2024-12-26',
    ])
  })

  test('XHEL', () => {
    expect(holidays('XHEL', 2024)).toEqual([
      '2024-01-01',
      '2024-01-06',
      '2024-03-29',
      '2024-04-01',
      '2024-05-01',
      '2024-05-09',
      '2024-06-21',
      '2024-12-06',
      '2024-12-24',
      '2024-12-25',
      '2024-12-26',
      '2024-12-31',
    ])
  })

  test('XETR', () => {
    expect(holidays('XETR', 2024)).toEqual([
      '2024-01-01',
      '2024-03-29',
      '2024-04-01',
      '2024-05-01',
      '2024-12-24',
      '2024-12-25',
      '2024-12-26',
      '2024-12-31',
    ])
  })

  test('EQTB', () => {
    expect(holidays('EQTB', 2024)).toEqual([
      '2024-01-01',
      '2024-03-29',
      '2024-04-01',
      '2024-05-01',
      '2024-12-24',
      '2024-12-25',
      '2024-12-26',
      '2024-12-31',
    ])
  })

  test('XCSE', () => {
    expect(holidays('XCSE', 2024)).toEqual([
      '2024-01-01',
      '2024-03-28',
      '2024-03-29',
      '2024-04-01',
      '2024-05-09',
      '2024-05-10',
      '2024-05-20',
      '2024-06-05',
      '2024-12-24',
      '2024-12-25',
      '2024-12-26',
      '2024-12-31',
    ])
  })

  test('MTAA', () => {
    expect(holidays('MTAA', 2024)).toEqual([
      '2024-01-01',
      '2024-03-29',
      '2024-04-01',
      '2024-05-01',
      '2024-08-15',
      '2024-12-24',
      '2024-12-25',
      '2024-12-26',
      '2024-12-31',
    ])
  })

  test('XLON', () => {
    expect(holidays('XLON', 2024)).toEqual([
      '2024-01-01',
      '2024-03-29',
      '2024-04-01',
      '2024-05-06',
      '2024-05-27',
      '2024-08-26',
      '2024-12-25',
      '2024-12-26',
    ])
  })

  test('handles far into the future', () => {
    expect(holidays('XSTO', 2090)).toEqual([
      '2090-01-01',
      '2090-01-06',
      '2090-04-14',
      '2090-04-17',
      '2090-05-01',
      '2090-05-25',
      '2090-06-06',
      '2090-06-23',
      '2090-12-24',
      '2090-12-25',
      '2090-12-26',
      '2090-12-31',
    ])
  })

  test('returns an empty array for unknown markets', () => {
    expect(holidays('UNKNOWN', 2021)).toEqual([])
  })

  test('works with lowercase market codes', () => {
    expect(holidays('xsto', 2024)).toEqual([
      '2024-01-01',
      '2024-01-06',
      '2024-03-29',
      '2024-04-01',
      '2024-05-01',
      '2024-05-09',
      '2024-06-06',
      '2024-06-21',
      '2024-12-24',
      '2024-12-25',
      '2024-12-26',
      '2024-12-31',
    ])
  })
})

describe('#halfdays', () => {
  test.each(['XSTO', 'SSME', 'XNGM', 'NSME'] as const)('%s', (mic) => {
    expect(halfdays(mic, 2024)).toEqual([
      '2024-01-05',
      '2024-03-28',
      '2024-04-30',
      '2024-05-08',
      '2024-11-01',
    ])
  })

  test.each(['XAMS', 'XPAR', 'XMAD', 'XBRU', 'XLON'] as const)('%s', (mic) => {
    expect(halfdays(mic, 2024)).toEqual(['2024-12-24', '2024-12-31'])
  })

  test('MTAA', () => {
    expect(halfdays('MTAA', 2024)).toEqual([
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
      '2024-03-28',
      '2024-04-25',
      '2024-04-26',
      '2024-08-01',
      '2024-08-02',
      '2024-08-03',
      '2024-08-04',
      '2024-08-05',
      '2024-08-06',
      '2024-08-07',
      '2024-08-08',
      '2024-08-09',
      '2024-08-10',
      '2024-08-11',
      '2024-08-12',
      '2024-08-13',
      '2024-08-14',
      '2024-08-16',
      '2024-08-17',
      '2024-08-18',
      '2024-08-19',
      '2024-08-20',
      '2024-08-21',
      '2024-08-22',
      '2024-08-23',
      '2024-08-24',
      '2024-08-25',
      '2024-08-26',
      '2024-08-27',
      '2024-08-28',
      '2024-08-29',
      '2024-08-30',
      '2024-08-31',
      '2024-11-01',
      '2024-12-23',
      '2024-12-27',
      '2024-12-30',
    ])
  })

  test('EQTB', () => {
    expect(halfdays('EQTB', 2024)).toEqual([
      '2024-05-09',
      '2024-05-20',
      '2024-10-03',
      '2024-12-30',
    ])
  })

  test('works with lowercase market codes', () => {
    expect(halfdays('xsto', 2024)).toEqual([
      '2024-01-05',
      '2024-03-28',
      '2024-04-30',
      '2024-05-08',
      '2024-11-01',
    ])
  })
})

describe('#isHoliday', () => {
  test('weekends are always holidays', () => {
    expect(isHoliday('XSTO', new Date('2024-05-04'))).toBe(true)
    expect(isHoliday('XSTO', new Date('2024-05-05'))).toBe(true)
  })

  test('returns true if today is a holiday', () => {
    expect(isHoliday('XSTO', new Date('2021-04-02'))).toBe(true)
  })

  test('returns false if today is not a holiday', () => {
    expect(isHoliday('XSTO', new Date('2021-04-01'))).toBe(false)
  })

  test('works with lowercase market codes', () => {
    expect(isHoliday('xsto', new Date('2021-04-02'))).toBe(true)
  })
})

describe('#isHalfday', () => {
  test('returns true if today is a halfday', () => {
    expect(isHalfday('XSTO', new Date('2024-01-05'))).toBe(true)
  })

  test('returns false if today is not a halfday', () => {
    expect(isHalfday('XSTO', new Date('2024-01-06'))).toBe(false)
  })

  test('works with lowercase market codes', () => {
    expect(isHalfday('xsto', new Date('2024-01-05'))).toBe(true)
  })
})

describe('#isOpen', () => {
  test('returns false if today is a holiday', () => {
    vi.setSystemTime(new Date('2024-04-01 09:00:00'))

    expect(isOpen('XSTO')).toBe(false)
  })

  test('handles halfday open', () => {
    vi.setSystemTime(new Date('2024-01-05 09:00:00'))

    expect(isOpen('XSTO')).toBe(true)
  })

  test('handles halfday close', () => {
    vi.setSystemTime(new Date('2024-01-05 13:00:00'))

    expect(isOpen('XSTO')).toBe(false)
  })

  test('returns true if regular day and in opening hours', () => {
    vi.setSystemTime(new Date('2024-05-02 09:00:00'))

    expect(isOpen('XSTO')).toBe(true)
  })

  test('returns false if regular day and before opening hours', () => {
    vi.setSystemTime(new Date('2024-05-02 08:59:59'))

    expect(isOpen('XSTO')).toBe(false)
  })

  test('returns false if regular day and after closing hours', () => {
    vi.setSystemTime(new Date('2024-05-02 17:30:00'))

    expect(isOpen('XSTO')).toBe(false)
  })

  test('handles special close days', () => {
    vi.setSystemTime(new Date('2024-12-30 14:00:00'))

    expect(isOpen('EQTB')).toBe(false)
  })

  test('works with lowercase market codes', () => {
    vi.setSystemTime(new Date('2024-05-02 09:00:00'))

    expect(isOpen('xsto')).toBe(true)
  })
})

describe('#formatOpeningHours', () => {
  test.each([
    ['XSTO', '09:00 – 17:30'],
    ['SSME', '09:00 – 17:30'],
    ['NSME', '09:00 – 17:30'],
    ['XAMS', '09:00 – 17:30'],
    ['XPAR', '09:00 – 17:30'],
    ['XHEL', '10:00 – 18:25'],
    ['FSME', '10:00 – 18:25'],
    ['XETR', '09:00 – 17:30'],
    ['EQTB', '08:00 – 22:00'],
    ['XMAD', '09:00 – 17:30'],
    ['XCSE', '09:00 – 16:55'],
    ['DSME', '09:00 – 16:55'],
    ['XNGM', '09:00 – 17:25'],
    ['XSAT', '09:00 – 17:25'],
    ['MTAA', '09:00 – 17:30'],
    ['XBRU', '09:00 – 17:30'],
    ['XLIS', '08:00 – 16:30'],
    ['XLON', '08:00 – 16:30'],
  ] as const)('%s', (mic, expected) => {
    vi.setSystemTime(new Date('2024-01-04 12:00:00'))

    expect(formatOpeningHours(mic)).toBe(expected)
  })

  test.each([
    ['XSTO', '2024-01-05', '09:00 – 13:00'],
    ['NSME', '2024-01-05', '09:00 – 13:00'],
    ['MTAA', '2024-12-30', '09:00 – 17:30'],
    ['XAMS', '2024-12-24', '09:00 – 13:55'],
    ['XBRU', '2024-12-24', '09:00 – 13:55'],
    ['XMAD', '2024-12-24', '09:00 – 14:00'],
    ['XPAR', '2024-12-24', '09:00 – 14:05'],
    ['XNGM', '2024-01-05', '09:00 – 12:55'],
    ['XSAT', '2024-01-05', '09:00 – 12:55'],
    ['XLIS', '2024-12-24', '08:00 – 13:05'],
    ['XLON', '2024-12-24', '08:00 – 12:30'],
    ['EQTB', '2024-05-09', '08:00 – 20:00'], // Normal irregular close
    ['EQTB', '2024-12-30', '08:00 – 14:00'], // Special irregular close day before New Year's Eve
  ] as const)('handles halfdays for %s', (mic, date, expected) => {
    vi.setSystemTime(new Date(`${date} 12:00:00`))

    expect(formatOpeningHours(mic)).toBe(expected)
  })

  test('works with lowercase market codes', () => {
    vi.setSystemTime(new Date('2024-01-04 12:00:00'))

    expect(formatOpeningHours('xsto')).toBe('09:00 – 17:30')
  })
})

describe('#whichHoliday', () => {
  test('returns null if not a holiday and not a half day', () => {
    expect(whichHoliday('XSTO', new Date('2021-04-04'))).toBe(null)
  })

  test.each([
    ['2024-01-01', 'newYearsDay'],
    ['2025-01-06', 'epiphany'],
    ['2024-03-29', 'goodFriday'],
    ['2024-04-01', 'easterMonday'],
    ['2024-05-01', 'laborDay'],
    ['2024-05-09', 'ascensionDay'],
    ['2024-06-06', 'independenceDaySweden'],
    ['2024-06-21', 'midsummerEve'],
    ['2024-06-22', 'midsummerDay'],
    ['2024-12-24', 'christmasEve'],
    ['2024-12-25', 'christmasDay'],
    ['2024-12-26', 'boxingDay'],
    ['2024-12-31', 'newYearsEve'],
  ] as const)('handle %s', (date, holiday) => {
    expect(whichHoliday('XSTO', new Date(date))).toBe(holiday)
  })

  test.each([
    ['XLON', '2024-05-06', 'bankHoliday'],
    ['MTAA', '2024-08-15', 'assumptionDay'],
    ['MTAA', '2024-04-25', 'noTAH'],
  ] as const)('handles special case for %s on %s', (mic, date, expected) => {
    expect(whichHoliday(mic, new Date(date))).toBe(expected)
  })

  test('handles XHEL independence day', () => {
    expect(whichHoliday('XHEL', new Date('2024-12-06'))).toBe(
      'independenceDayFinland'
    )
  })

  test('works with lowercase market codes', () => {
    expect(whichHoliday('xsto', new Date('2021-04-02'))).toBe('goodFriday')
  })
})

describe('#marketOpeningHours', () => {
  test('returns null for unknown markets', () => {
    expect(marketOpeningHours('UNKNOWN', new Date('2024-05-02'))).toBe(null)
  })

  test('handles regular opening hours', () => {
    expect(marketOpeningHours('XSTO', new Date('2024-05-02'))).toEqual({
      openHour: 9,
      openMinute: 0,
      closeHour: 17,
      closeMinute: 30,
    })
  })

  test('handles halfdays', () => {
    expect(marketOpeningHours('XSTO', new Date('2024-01-05'))).toEqual({
      openHour: 9,
      openMinute: 0,
      closeHour: 13,
      closeMinute: 0,
    })
  })

  test('works with lowercase market codes', () => {
    expect(marketOpeningHours('xsto', new Date('2024-05-02'))).toEqual({
      openHour: 9,
      openMinute: 0,
      closeHour: 17,
      closeMinute: 30,
    })
  })
})
