import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type PackageJson = {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const pkg: PackageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
)

describe('package.json', () => {
  it('ships the OpenSearch instrumentation as a dependency so instrumentations.opensearch() works without extra installs', () => {
    expect(pkg.dependencies).toHaveProperty(
      '@sebspark/opentelemetry-instrumentation-opensearch'
    )
    expect(pkg.peerDependencies ?? {}).not.toHaveProperty(
      '@sebspark/opentelemetry-instrumentation-opensearch'
    )
  })
})
