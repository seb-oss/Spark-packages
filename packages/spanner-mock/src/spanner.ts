import { jest } from '@jest/globals'
import { createMockInstance } from './instance'

type SpannerArgs = {
  projectId?: string
}

const spannerClients = new Map()
const createNewSpannerClient = (projectId: string) => {
  const instances = new Map<string, ReturnType<typeof createMockInstance>>()
  return {
    instance: jest.fn((instanceName: string) => {
      if (!instances.has(instanceName)) {
        instances.set(instanceName, createMockInstance())
      }
      return instances.get(instanceName)
    }),
    close: jest.fn(() => {
      spannerClients.delete(projectId)
    }),
  }
}

export const createSpanner = (args: SpannerArgs) => {
  const projectId = args?.projectId || ''
  if (!spannerClients.has(projectId)) {
    spannerClients.set(projectId, createNewSpannerClient(projectId))
  }
  return spannerClients.get(projectId)
}
