import { performance } from 'node:perf_hooks'
import {
  MockserverContainer,
  type StartedMockserverContainer,
} from '@testcontainers/mockserver'
import { mockServerClient } from 'mockserver-client'
import { wait } from '../timing'

export const startApi = async () => {
  const container = await new MockserverContainer(
    'mockserver/mockserver:latest'
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
  // await wait(200)
  return await res.json()
}
