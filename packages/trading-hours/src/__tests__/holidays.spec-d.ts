import { describe, expectTypeOf, it } from 'vitest'
import type { Holiday } from '../types'
import type {
  christianHolidays,
  independenceDays,
  staticHolidays,
} from '../utils'

describe('Holiday', () => {
  it('includes every key whichHoliday looks up', () => {
    expectTypeOf<keyof ReturnType<typeof staticHolidays>>().toExtend<Holiday>()
    expectTypeOf<
      keyof ReturnType<typeof christianHolidays>
    >().toExtend<Holiday>()
    expectTypeOf<`independenceDay${Capitalize<
      keyof ReturnType<typeof independenceDays>
    >}`>().toExtend<Holiday>()
  })

  it('includes every value whichHoliday can return', () => {
    expectTypeOf<
      | 'independenceDayDenmark'
      | 'independenceDayGermany'
      | 'pentecost'
      | 'pentecostMonday'
      | 'beforeGoodFriday'
      | 'beforeEpiphany'
      | 'beforeAscensionDay'
      | 'beforeAllSaintsDay'
    >().toExtend<Holiday>()
  })
})
