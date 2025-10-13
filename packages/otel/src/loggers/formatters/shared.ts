import type { HrTime } from '@opentelemetry/api'
import type { LogAttributes } from '@opentelemetry/api-logs'
import type { Resource } from '@opentelemetry/resources'
import type { ReadableLogRecord } from '@opentelemetry/sdk-logs'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-node'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import stringify from 'fast-safe-stringify'
import { colors, levelColorMap, levelIconMap } from './style'

type IResource = Pick<Resource, 'attributes'>
type IInstrumentation = ReadableLogRecord['instrumentationScope']

export function formatTimestamp(time: HrTime): string {
  const date = new Date(hrTimeToMillis(time))
  return colors.dim(date.toISOString().slice(11, 23)) // HH:mm:ss.sss
}

export function formatService(resource: IResource): string {
  const name = resource.attributes[ATTR_SERVICE_NAME] ?? 'unknown-service'
  const version = resource.attributes[ATTR_SERVICE_VERSION] ?? '1.0.0'
  return colors.gray(`[${name}@${version}]`)
}

export function formatLevel(record: ReadableLogRecord): string {
  const text = (record.severityText ?? 'INFO').toUpperCase()
  const colorFn = levelColorMap[text] ?? colors.white
  const icon = levelIconMap[text] ?? '•'
  return `${icon}  ${colorFn(text.padEnd(5))}`
}

export function formatScope(
  resource: IResource,
  instrumentationScope: IInstrumentation
): string {
  const component = resource.attributes['component.name']
  const { name, version } = instrumentationScope
  const scopeLabel =
    component || (name && name !== 'unknown' ? name : undefined)
  if (!scopeLabel) return ''

  const versionLabel = version ? `@${version}` : ''
  return colors.cyan(`${scopeLabel}${versionLabel} `)
}

export function formatMessage(record: ReadableLogRecord): string {
  return typeof record.body === 'string' ? record.body : stringify(record.body)
}

export function formatAttributes(attrs: LogAttributes): string {
  const keys = Object.keys(attrs).filter(
    (k) => !k.startsWith('service.') && !k.startsWith('serviceContext.')
  )
  if (keys.length === 0) return ''
  const formatted = keys.map((k) => {
    const val = attrs[k]
    return `${k}=${typeof val === 'object' ? stringify(val) : val}`
  })
  return `  ${colors.gray(formatted.join(' '))}`
}

export function hrTimeToMillis(hrTime: [number, number]): number {
  return hrTime[0] * 1000 + Math.floor(hrTime[1] / 1_000_000)
}

export function calculateDuration(span: ReadableSpan): number {
  const start = hrTimeToMillis(span.startTime)
  const end = hrTimeToMillis(span.endTime)
  return Math.max(0, Math.round(end - start))
}
