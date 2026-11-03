import { performance } from 'node:perf_hooks'
import { setTimeout } from 'node:timers/promises'
import {
  MockserverContainer,
  type StartedMockserverContainer,
} from '@testcontainers/mockserver'

export const startApi = async () => {
  const container = await new MockserverContainer(
    'mockserver/mockserver:9.2.0@sha256:016f7d16bc88d2e1aa52d5a177f1aafee758cf70bea5e0624b0ab2c32f394df1'
  ).start()

  const res = await fetch(`${container.getUrl()}/mockserver/expectation`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      httpRequest: {
        method: 'GET',
        path: '/health',
      },
      httpResponse: {
        body: {
          type: 'JSON',
          json: { status: 'ok' },
        },
        statusCode: 200,
      },
    }),
  })
  if (!res.ok) {
    throw new Error(`Failed to create expectation: ${res.status}`)
  }

  return container
}

export const pingApi = async (
  mockServer: StartedMockserverContainer,
  timeoutMs = 1500
) => {
  const baseUrl = mockServer.getUrl()

  const res = await fetch(`${baseUrl}/health`)
  if (!res.ok) {
    throw new Error(`Unexpected status: ${res.status}`)
  }

  // introduce lag
  // await setTimeout(200)
  return await res.json()
}
