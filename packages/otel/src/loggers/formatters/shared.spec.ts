import type { HrTime } from '@opentelemetry/api'
import type { ReadableLogRecord } from '@opentelemetry/sdk-logs'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import { describe, expect, it } from 'vitest'
import { formatAttributes, formatLevel, formatScope } from './shared'

const makeLogRecord = (
  overrides: Partial<ReadableLogRecord> = {}
): ReadableLogRecord =>
  ({
    severityNumber: 9,
    severityText: 'INFO',
    body: 'test',
    attributes: {},
    resource: { attributes: {} } as any,
    instrumentationScope: { name: 'unknown' },
    hrTime: [0, 0] as HrTime,
    hrTimeObserved: [0, 0] as HrTime,
    droppedAttributesCount: 0,
    ...overrides,
  }) as ReadableLogRecord

const makeResource = (attributes: Record<string, unknown> = {}) => ({
  attributes,
})

describe('formatLevel', () => {
  it('falls back to INFO when severityText is undefined', () => {
    const record = makeLogRecord({ severityText: undefined })
    const result = formatLevel(record)
    expect(result).toContain('INFO')
  })

  it('uses the provided severityText', () => {
    const record = makeLogRecord({ severityText: 'ERROR' })
    const result = formatLevel(record)
    expect(result).toContain('ERROR')
  })
})

describe('formatScope', () => {
  it('returns empty string when name is unknown and no component', () => {
    const resource = makeResource()
    const scope = { name: 'unknown' }
    const result = formatScope(resource, scope)
    expect(result).toBe('')
  })

  it('returns empty string when name is empty and no component', () => {
    const resource = makeResource()
    const scope = { name: '' }
    const result = formatScope(resource, scope)
    expect(result).toBe('')
  })

  it('returns colored scope label when component.name is set on resource', () => {
    const resource = makeResource({ 'component.name': 'my-component' })
    const scope = { name: 'unknown' }
    const result = formatScope(resource, scope)
    expect(result).toContain('my-component')
  })

  it('returns scope name when name is set and not unknown', () => {
    const resource = makeResource()
    const scope = { name: 'my-library' }
    const result = formatScope(resource, scope)
    expect(result).toContain('my-library')
  })
})

describe('formatAttributes', () => {
  it('returns empty string when only service.* keys are present', () => {
    const result = formatAttributes({
      [ATTR_SERVICE_NAME]: 'my-service',
      [ATTR_SERVICE_VERSION]: '1.0.0',
      'serviceContext.service': 'my-service',
      'serviceContext.version': '1.0.0',
    })
    expect(result).toBe('')
  })

  it('formats object values using stringify', () => {
    const result = formatAttributes({
      metadata: { key: 'value', count: 42 },
    })
    expect(result).toContain('metadata=')
    expect(result).toContain('value')
    expect(result).toContain('42')
  })

  it('formats primitive values directly', () => {
    const result = formatAttributes({ requestId: 'abc-123' })
    expect(result).toContain('requestId=abc-123')
  })

  it('returns empty string when all keys are filtered out', () => {
    const result = formatAttributes({
      'cloud.orchestrator': 'kubernetes',
      'component.name': 'my-comp',
    })
    expect(result).toBe('')
  })
})
