import { describe, expect, it } from 'vitest'
import { paramsSerializer } from './paramsSerializer'

describe('paramsSerializer', () => {
  const params = {
    foo: 'bar',
    baz: undefined,
    herp: ['hello', 'worl,d'],
    derp: 'foo,bar',
  }

  it('handles empty object', () => {
    expect(paramsSerializer()()).toEqual('')
  })
  it('defaults to brackets', () => {
    expect(paramsSerializer()(params)).toEqual(
      'foo=bar&herp[]=hello&herp[]=worl,d&derp=foo,bar'
    )
  })
  it('handles indices', () => {
    expect(paramsSerializer('indices')(params)).toEqual(
      'foo=bar&herp[0]=hello&herp[1]=worl,d&derp=foo,bar'
    )
  })
  it('handles brackets', () => {
    expect(paramsSerializer('brackets')(params)).toEqual(
      'foo=bar&herp[]=hello&herp[]=worl,d&derp=foo,bar'
    )
  })
  it('handles repeat', () => {
    expect(paramsSerializer('repeat')(params)).toEqual(
      'foo=bar&herp=hello&herp=worl,d&derp=foo,bar'
    )
  })
  it('handles comma', () => {
    expect(paramsSerializer('comma')(params)).toEqual(
      'foo=bar&herp=hello,worl%2Cd&derp=foo,bar'
    )
  })
})
