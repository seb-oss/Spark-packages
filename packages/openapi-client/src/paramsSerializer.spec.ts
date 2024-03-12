import { describe, expect, it } from 'vitest'
import { paramsSerializer } from './paramsSerializer'

describe('paramsSerializer', () => {
  const params = {
    foo: 'bar',
    baz: undefined,
    herp: ['hello', 'world'],
  }

  it('handles empty object', () => {
    expect(paramsSerializer()()).toEqual('')
  })
  it('defaults to brackets', () => {
    expect(paramsSerializer()(params)).toEqual(
      'foo=bar&herp[]=hello&herp[]=world'
    )
  })
  it('handles indices', () => {
    expect(paramsSerializer('indices')(params)).toEqual(
      'foo=bar&herp[0]=hello&herp[1]=world'
    )
  })
  it('handles brackets', () => {
    expect(paramsSerializer('brackets')(params)).toEqual(
      'foo=bar&herp[]=hello&herp[]=world'
    )
  })
  it('handles repeat', () => {
    expect(paramsSerializer('repeat')(params)).toEqual(
      'foo=bar&herp=hello&herp=world'
    )
  })
  it('handles comma', () => {
    expect(paramsSerializer('comma')(params)).toEqual(
      'foo=bar&herp=hello,world'
    )
  })
})
