import { performance } from 'node:perf_hooks'
import { setTimeout } from 'node:timers/promises'
import {
  MockserverContainer,
  type StartedMockserverContainer,
} from '@testcontainers/mockserver'
import { mockServerClient } from 'mockserver-client'

export const startApi = async () => {
  const container = await new MockserverContainer(
    'mockserver/mockserver:9.2.0@sha256:016f7d16bc88d2e1aa52d5a177f1aafee758cf70bea5e0624b0ab2c32f394df1'
  ).start()

  const client = mockServerClient(
    container.getHost(),
    container.getMockserverPort()
  )
  await client.mockAnyResponse({
    httpRequest: {
      method: 'GET',
      path: '/health',
    },
    httpResponse: {
      body: {
        json: JSON.stringify({ status: 'ok' }),
      },
      statusCode: 200,
    },
  })

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
