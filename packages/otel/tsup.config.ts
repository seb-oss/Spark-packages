import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@opentelemetry/api',
    '@opentelemetry/core',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/semantic-conventions',
    '@opentelemetry/instrumentation',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/exporter-logs-otlp-http',
    '@opentelemetry/exporter-metrics-otlp-http',
    'require-in-the-middle',
  ],
})
