import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type PackageJson = {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

const pkg: PackageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
)

describe('package.json', () => {
  it('declares the OpenSearch instrumentation as an optional peer, not a dependency', () => {
    expect(pkg.dependencies).not.toHaveProperty(
      '@sebspark/opentelemetry-instrumentation-opensearch'
    )
    expect(pkg.peerDependencies).toHaveProperty(
      '@sebspark/opentelemetry-instrumentation-opensearch',
      '^0.4.2'
    )
    expect(pkg.peerDependenciesMeta).toHaveProperty(
      ['@sebspark/opentelemetry-instrumentation-opensearch', 'optional'],
      true
    )
  })

  it('declares the OpenSearch client as an optional peer, not a dependency', () => {
    expect(pkg.dependencies).not.toHaveProperty(
      '@opensearch-project/opensearch'
    )
    expect(pkg.peerDependencies).toHaveProperty(
      '@opensearch-project/opensearch',
      '>=2'
    )
    expect(pkg.peerDependenciesMeta).toHaveProperty(
      ['@opensearch-project/opensearch', 'optional'],
      true
    )
  })
})
