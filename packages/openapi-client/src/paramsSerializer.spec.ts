import { describe, expect, it } from 'vitest'
import { paramsSerializer } from './paramsSerializer'

describe('paramsSerializer', () => {
  const params = {
    foo: 'bar',
    baz: undefined,
    woop: 1,
    herp: ['hello', 'worl,d'],
    derp: 'foo,bar',
    meow: true,
    purr: false,
    woof: new Date('2025-01-01T00:01:02.003Z'),
  }

  it('handles empty object', () => {
    expect(paramsSerializer()()).toEqual('')
  })
  it('defaults to brackets', () => {
    expect(paramsSerializer()(params)).toEqual(
      'foo=bar&woop=1&herp[]=hello&herp[]=worl,d&derp=foo,bar&meow=true&purr=false&woof=2025-01-01T00%3A01%3A02.003Z'
    )
  })
  it('handles indices', () => {
    expect(paramsSerializer('indices')(params)).toEqual(
      'foo=bar&woop=1&herp[0]=hello&herp[1]=worl,d&derp=foo,bar&meow=true&purr=false&woof=2025-01-01T00%3A01%3A02.003Z'
    )
  })
  it('handles brackets', () => {
    expect(paramsSerializer('brackets')(params)).toEqual(
      'foo=bar&woop=1&herp[]=hello&herp[]=worl,d&derp=foo,bar&meow=true&purr=false&woof=2025-01-01T00%3A01%3A02.003Z'
    )
  })
  it('handles repeat', () => {
    expect(paramsSerializer('repeat')(params)).toEqual(
      'foo=bar&woop=1&herp=hello&herp=worl,d&derp=foo,bar&meow=true&purr=false&woof=2025-01-01T00%3A01%3A02.003Z'
    )
  })
  it('handles comma', () => {
    expect(paramsSerializer('comma')(params)).toEqual(
      'foo=bar&woop=1&herp=hello,worl%2Cd&derp=foo,bar&meow=true&purr=false&woof=2025-01-01T00%3A01%3A02.003Z'
    )
  })
})
