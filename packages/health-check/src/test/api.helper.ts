import { performance } from 'node:perf_hooks'
import { MockserverContainer, type StartedMockserverContainer } from '@testcontainers/mockserver'
import { mockServerClient } from 'mockserver-client'

export const startApi = async () => {
  const container = await new MockserverContainer('mockserver/mockserver:latest').start()
  
  const client = mockServerClient(container.getHost(), container.getMockserverPort())
  await client.mockAnyResponse({
    httpRequest: {
      method: "GET",
      path: "/health",
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

export const pingApi = async (mockServer: StartedMockserverContainer, timeoutMs = 1500) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const baseUrl = mockServer.getUrl()

  const start = performance.now()
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Unexpected status: ${res.status}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}
