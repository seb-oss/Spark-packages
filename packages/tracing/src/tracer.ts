/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as opentelemetry from '@opentelemetry/api'

// Not functionally required but gives some insight what happens behind the scenes
const { diag, DiagConsoleLogger, DiagLogLevel } = opentelemetry
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter'
import { SocketIoInstrumentation } from '@opentelemetry/instrumentation-socket.io'

import {
  Sampler,
  AlwaysOnSampler,
  BatchSpanProcessor,
  SpanExporter,
  SamplingDecision,
} from '@opentelemetry/sdk-trace-base'

import { Resource } from '@opentelemetry/resources'
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMATTRS_HTTP_ROUTE,
  SEMATTRS_HTTP_TARGET,
} from '@opentelemetry/semantic-conventions'

import { Attributes, SpanKind } from '@opentelemetry/api'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'

type CloudTraceConfig = {
  projectId: string
  serviceName: string
}

type LocalConfig = {
  serviceName: string
  url: string
}

export const setupTracing = (config: CloudTraceConfig | LocalConfig) => {
  const { serviceName } = config
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
    }),
    sampler: filterSampler(
      [ignoreHealthCheck, ignorePostgres],
      new AlwaysOnSampler()
    ),
  })
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      // Express instrumentation expects HTTP layer to be instrumented
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
      new UndiciInstrumentation(),
      new SocketIoInstrumentation(),
    ],
  })

  let exporter: SpanExporter

  if ('projectId' in config) {
    exporter = new TraceExporter({
      projectId: config.projectId,
      // https://www.npmjs.com/package/@google-cloud/opentelemetry-cloud-trace-exporter#resource-attributes
      // will export all resource attributes that start with "service."
      resourceFilter: /^service\./,
    })
  } else {
    exporter = new OTLPTraceExporter({
      url: config.url,
    })
  }

  // Configure the span processor to batch and send spans to the exporter
  provider.addSpanProcessor(new BatchSpanProcessor(exporter))

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register()

  return opentelemetry.trace.getTracer(serviceName)
}

type FilterFunction = (
  spanName: string,
  spanKind: SpanKind,
  attributes: Attributes
) => boolean

function filterSampler(
  ignoreFn: FilterFunction | FilterFunction[],
  parent: Sampler
): Sampler {
  return {
    shouldSample(ctx, tid, spanName, spanKind, attr, links) {
      if (Array.isArray(ignoreFn)) {
        for (const fn of ignoreFn) {
          if (fn(spanName, spanKind, attr)) {
            return { decision: SamplingDecision.NOT_RECORD }
          }
        }
      } else if (ignoreFn(spanName, spanKind, attr)) {
        return { decision: SamplingDecision.NOT_RECORD }
      }
      return parent.shouldSample(ctx, tid, spanName, spanKind, attr, links)
    },
    toString() {
      return `FilterSampler(${parent.toString()})`
    },
  }
}

const ignoreHealthCheck = (
  spanName: string,
  spanKind: SpanKind,
  attributes: Attributes
) => {
  const isServerSpan =
    spanKind === opentelemetry.SpanKind.SERVER ||
    spanKind === opentelemetry.SpanKind.INTERNAL
  const isHealthRoute =
    attributes[SEMATTRS_HTTP_ROUTE] === '/health' ||
    attributes[SEMATTRS_HTTP_TARGET] === '/health'
  return isServerSpan && isHealthRoute
}

const ignorePostgres = (spanName: string) => {
  return spanName === 'pg-pool.connect'
}
