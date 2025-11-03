import { describe, expect, it } from 'vitest'
import { filename } from '../index'

describe('cli', () => {
  describe('filename', () => {
    it('returns the same name for regular filename', () => {
      expect(filename('foobar')).toEqual('foobar')
    })
    it('returns a working name for weird filename', () => {
      expect(filename('cdapi-service.openapi-3.0')).toEqual(
        'cdapi-service_openapi-3_0'
      )
    })
  })
})
