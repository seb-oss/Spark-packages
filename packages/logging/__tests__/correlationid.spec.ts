import { getCorrId, runWithCorrelationId } from '../src/lib/correlationid'
describe('Test correlationId functionality', () => {
  it('Test corrId created when not supplied', () => {
    runWithCorrelationId(async () => {
      expect(getCorrId()).toEqual(expect.any(String))
    })
  })

  it('Test existing corrId is used', () => {
    runWithCorrelationId(async () => {
      expect(getCorrId()).toEqual('imafish')
    }, 'imafish')
  })

  it('Test corrId works in Promises', () => {
    runWithCorrelationId(async () => {
      const corrId = await new Promise((res) => {
        res(getCorrId())
      })
      expect(corrId).toEqual('imafish')
    }, 'imafish')
  })

  it('Test undefined corrId is not saved', () => {
    runWithCorrelationId(async () => {
      expect(getCorrId()).toEqual(expect.any(String))
    }, undefined)
  })
})
