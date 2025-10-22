import { SpanStatusCode } from '@opentelemetry/api'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getLogger, getTracer, initialize, instrumentations } from './'

describe('otel initialize', () => {
  const originalEnv = process.env
  let consoleLog: ReturnType<typeof vi.spyOn>
  let consoleInfo: ReturnType<typeof vi.spyOn>
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }

    process.env.OTEL_SERVICE_NAME = 'test-system'
    process.env.OTEL_SERVICE_VERSION = '0.6.2'

    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    consoleLog.mockRestore()
    consoleInfo.mockRestore()
    consoleError.mockRestore()
  })

  describe('no OTLP', () => {
    beforeEach(() => {
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    })
    it('sets up telemetry with ConsoleLogPrettyExporter and logs to console', async () => {
      process.env.LOG_LEVEL = 'INFO'
      await initialize(instrumentations.express, instrumentations.http)

      const logger = getLogger()
      logger.info('e2e-log')

      await new Promise((r) => setTimeout(r, 500))

      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[test-system@0.6.2]')
      )
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('e2e-log')
      )
    })
    it('sets up telemetry with ConsoleSpanPrettyExporter and logs to console', async () => {
      await initialize()

      const tracer = await getTracer()

      // Start root HTTP server span
      await tracer.withTrace(
        'http.server',
        {
          attributes: {
            'http.method': 'GET',
            'http.target': '/users/123',
            'http.route': '/users/:id',
            'http.status_code': 200,
            'http.flavor': '1.1',
            'net.peer.ip': '192.168.0.1',
            'net.peer.port': 443,
            'http.user_agent': 'curl/8.1.2',
            'otel.description': 'GET /users/123',
          },
          kind: 1, // SERVER
        },
        async (httpSpan) => {
          // Simulate some work before DB
          await new Promise((r) => setTimeout(r, 20))

          // Start Spanner DB span
          await tracer.withTrace(
            'spanner.query',
            {
              attributes: {
                'db.system': 'spanner',
                'db.name': 'users-db',
                'db.statement': 'SELECT * FROM users WHERE id = 123',
                'otel.description': 'SELECT FROM users',
              },
              kind: 2, // CLIENT
            },
            httpSpan,
            async (dbSpan) => {
              dbSpan.setStatus({ code: SpanStatusCode.OK })
              await new Promise((r) => setTimeout(r, 50))
            }
          )

          // Simulate some work between
          await new Promise((r) => setTimeout(r, 10))

          // Start PubSub span
          await tracer.withTrace(
            'pubsub.produce',
            {
              attributes: {
                'messaging.system': 'pubsub',
                'messaging.destination': 'user-events',
                'messaging.operation': 'send',
              },
              kind: 2, // CLIENT
            },
            httpSpan,
            async (pubsubSpan) => {
              pubsubSpan.setStatus({ code: SpanStatusCode.OK })
              await new Promise((r) => setTimeout(r, 50))
            }
          )

          // Final delay before ending HTTP span
          await new Promise((r) => setTimeout(r, 10))
          httpSpan.setStatus({ code: SpanStatusCode.OK })
        }
      )

      await new Promise((r) => setTimeout(r, 50))

      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[test-system@0.6.2]')
      )
      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining('└─ http.server')
      )
      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining('  └─ spanner.query')
      )
      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining('  └─ pubsub.produce')
      )
    })
  })
})
