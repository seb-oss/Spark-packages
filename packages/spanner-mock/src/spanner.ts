import { jest } from '@jest/globals'
import { createMockInstance } from './instance'

export const createSpanner = () => {
  const instances = new Map<string, ReturnType<typeof createMockInstance>>()
  return {
    instance: jest.fn((instanceName: string) => {
      if (!instances.has(instanceName)) {
        instances.set(instanceName, createMockInstance())
      }
      return instances.get(instanceName)
    }),
  }
}
