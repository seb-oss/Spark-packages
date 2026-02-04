import { defineConfig } from 'tsdown'

/** @type {import('tsdown').UserConfig} */
const userConfig = {
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  dts: true,
  sourcemap: true,
  clean: true,
  inlineOnly: false,
  inputOptions: {
    checks: {
      eval: false,
    },
  },
  external: [
    // full centralized list of CJS deps
    '@opentelemetry/instrumentation',
    '@opentelemetry/instrumentation-http',
    '@opentelemetry/instrumentation-express',
    '@opentelemetry/instrumentation-grpc',
    '@opentelemetry/instrumentation-redis',
    '@opentelemetry/instrumentation-dns',
    '@opentelemetry/instrumentation-net',
    '@opentelemetry/instrumentation-fs',
    '@opentelemetry/instrumentation-undici',
    '@opentelemetry/instrumentation-socket.io',
    'require-in-the-middle',
  ],
}

export default defineConfig(userConfig)
