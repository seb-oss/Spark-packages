// import { expect, test } from 'vitest'
// import { getCorrId, runWithCorrelationId } from './correlationid'

// test('corrId created when not supplied', () => {
//   runWithCorrelationId(async () => {
//     expect(getCorrId()).toEqual(expect.any(String))
//   })
// })

// test('existing corrId is used', () => {
//   runWithCorrelationId(async () => {
//     expect(getCorrId()).toEqual('imafish')
//   }, 'imafish')
// })

// test('corrId works in Promises', () => {
//   runWithCorrelationId(async () => {
//     const corrId = await new Promise((res) => {
//       res(getCorrId())
//     })

//     expect(corrId).toEqual('imafish')
//   }, 'imafish')
// })

// test('undefined corrId is not saved', () => {
//   runWithCorrelationId(async () => {
//     expect(getCorrId()).toEqual(expect.any(String))
//   }, undefined)
// })
