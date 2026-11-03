import { describe, expect, it, vi } from 'vitest'

vi.mock('@sebspark/opentelemetry-instrumentation-opensearch', () => {
  throw new Error(
    "Cannot find package '@sebspark/opentelemetry-instrumentation-opensearch'"
  )
})

describe('instrumentations.opensearch when the OpenSearch packages cannot be loaded', () => {
  it('rejects with an error naming the packages to install, keeping the import failure as cause', async () => {
    const { instrumentations } = await import('./instrumentations')

    await expect(instrumentations.opensearch()).rejects.toMatchObject({
      message:
        'OpenSearch instrumentation requires @sebspark/opentelemetry-instrumentation-opensearch and @opensearch-project/opensearch to be installed',
      cause: expect.any(Error),
    })
  })
})
