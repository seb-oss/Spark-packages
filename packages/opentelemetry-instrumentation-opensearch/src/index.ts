import Transport, {
  type ApiError,
  type ApiResponse,
  type TransportRequestCallback,
  type TransportRequestOptions,
  type TransportRequestParams,
  type TransportRequestPromise,
} from '@opensearch-project/opensearch/lib/Transport.js'
import opensearchPkg from '@opensearch-project/opensearch/package.json' with {
  type: 'json',
}
import {
  context,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api'
import { suppressTracing } from '@opentelemetry/core'
import {
  InstrumentationBase,
  type InstrumentationConfig,
} from '@opentelemetry/instrumentation'
import {
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_QUERY_TEXT,
  ATTR_DB_SYSTEM_NAME,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
} from '@opentelemetry/semantic-conventions'
import pkg from '../package.json' with { type: 'json' }

const PACKAGE_VERSION: string = pkg.version
const OPENSEARCH_CLIENT_VERSION: string = opensearchPkg.version

/**
 * Parses an OpenSearch path into its index and operation components.
 * e.g. `/my_index/_search` → `{ index: 'my_index', operation: 'search' }`
 * e.g. `/_bulk` → `{ operation: 'bulk' }`
 */
function parsePath(path: string): { index?: string; operation?: string } {
  const match = path.match(/^\/(?:([^/_][^/]*)\/)?_([^/]+)/)
  if (!match) return {}
  return { index: match[1], operation: match[2] }
}

/** Configuration for {@link OpenSearchInstrumentation}. */
export interface OpenSearchInstrumentationConfig extends InstrumentationConfig {
  /**
   * Serialize the request body into `db.query.text`.
   * Set to `false` to disable capture entirely.
   * Defaults to `JSON.stringify`.
   */
  dbStatementSerializer?: false | ((params: TransportRequestParams) => string)

  /**
   * Hook called after span attributes are set, before the request is made.
   * Use to add custom attributes.
   */
  requestHook?: (span: Span, params: TransportRequestParams) => void

  /**
   * Hook called after a successful response is received.
   * Use to add custom attributes derived from the response.
   */
  responseHook?: (span: Span, response: ApiResponse) => void

  /**
   * When `true`, child span creation inside the Transport call is suppressed so
   * HTTP instrumentation cannot produce a duplicate span.
   * When `false` (default), the db span is set as the active context so HTTP
   * child spans are properly parented and W3C trace headers are propagated.
   */
  suppressInternalInstrumentation?: boolean

  /**
   * If set, the value of the `@opensearch-project/opensearch` client version is
   * recorded as a span attribute under this name.
   * e.g. `'db.opensearch.client.version'`
   */
  moduleVersionAttributeName?: string
}

/**
 * OpenTelemetry instrumentation for `@opensearch-project/opensearch`.
 *
 * Patches `Transport.prototype.request` to create a `db` CLIENT span for every
 * request. Tracing is suppressed inside the call so the HTTP instrumentation
 * does not produce a duplicate child span.
 */
export class OpenSearchInstrumentation extends InstrumentationBase {
  private readonly osConfig: OpenSearchInstrumentationConfig
  private declare _original: typeof Transport.prototype.request | undefined

  constructor(config: OpenSearchInstrumentationConfig = {}) {
    super(
      '@sebspark/opentelemetry-instrumentation-opensearch',
      PACKAGE_VERSION,
      config
    )
    this.osConfig = config
  }

  protected init() {}

  /** Patches `Transport.prototype.request` with span instrumentation. */
  override enable() {
    if (this._original) return
    const self = this
    const original: (
      this: Transport,
      params: TransportRequestParams,
      options?: TransportRequestOptions
    ) => TransportRequestPromise<ApiResponse> = Transport.prototype.request
    this._original = original

    function patchedRequest(
      params: TransportRequestParams,
      options?: TransportRequestOptions
    ): TransportRequestPromise<ApiResponse>
    function patchedRequest(
      params: TransportRequestParams,
      options: TransportRequestOptions | undefined,
      callback: (err: ApiError, result: ApiResponse) => void
    ): TransportRequestCallback
    function patchedRequest(
      this: Transport,
      params: TransportRequestParams,
      options?: TransportRequestOptions,
      callback?: (err: ApiError, result: ApiResponse) => void
    ): TransportRequestPromise<ApiResponse> | TransportRequestCallback {
      const { index, operation } = parsePath(params.path)
      const spanName =
        [operation, index].filter(Boolean).join(' ') || params.path
      const span = self.tracer.startSpan(spanName, {
        kind: SpanKind.CLIENT,
        attributes: {
          [ATTR_DB_SYSTEM_NAME]: 'opensearch',
          ...(operation && { [ATTR_DB_OPERATION_NAME]: operation }),
          ...(index && { 'db.opensearch.index': index }),
          ...(params.body &&
            self.osConfig?.dbStatementSerializer !== false && {
              [ATTR_DB_QUERY_TEXT]:
                typeof self.osConfig?.dbStatementSerializer === 'function'
                  ? self.osConfig.dbStatementSerializer(params)
                  : typeof params.body === 'string'
                    ? params.body
                    : JSON.stringify(params.body),
            }),
        },
      })
      self.osConfig?.requestHook?.(span, params)

      const endSpanOnSuccess = (res: ApiResponse) => {
        const { hostname, port } = res.meta.connection.url
        span.setAttribute(ATTR_SERVER_ADDRESS, hostname)
        if (port) span.setAttribute(ATTR_SERVER_PORT, Number(port))
        if (self.osConfig?.moduleVersionAttributeName) {
          span.setAttribute(
            self.osConfig.moduleVersionAttributeName,
            OPENSEARCH_CLIENT_VERSION
          )
        }
        self.osConfig?.responseHook?.(span, res)
        span.end()
      }
      const endSpanOnError = (err: unknown) => {
        if (err instanceof Error) span.recordException(err)
        span.setStatus({ code: SpanStatusCode.ERROR })
        span.end()
      }

      const callCtx = self.osConfig?.suppressInternalInstrumentation
        ? suppressTracing(context.active())
        : trace.setSpan(context.active(), span)

      if (typeof callback === 'function') {
        return context.with(callCtx, () =>
          (
            original as (
              this: Transport,
              params: TransportRequestParams,
              options: TransportRequestOptions | undefined,
              callback: (err: ApiError, result: ApiResponse) => void
            ) => TransportRequestCallback
          ).call(this, params, options, (err, res) => {
            if (err) endSpanOnError(err)
            else endSpanOnSuccess(res)
            callback(err, res)
          })
        )
      }

      const result = context.with(callCtx, () =>
        original.call(this, params, options)
      )
      const settled = result.then(
        (res: ApiResponse) => {
          endSpanOnSuccess(res)
          return res
        },
        (err: unknown) => {
          endSpanOnError(err)
          throw err
        }
      )
      return Object.assign(settled, { abort: result.abort })
    }

    Transport.prototype.request = patchedRequest
  }

  /** Restores the original `Transport.prototype.request`. */
  override disable() {
    if (this._original) {
      Transport.prototype.request = this._original
      this._original = undefined
    }
  }
}
