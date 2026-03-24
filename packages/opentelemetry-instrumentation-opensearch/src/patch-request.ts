import type Transport from '@opensearch-project/opensearch/lib/Transport.js'
import type {
  ApiError,
  ApiResponse,
  TransportRequestCallback,
  TransportRequestOptions,
  TransportRequestParams,
  TransportRequestPromise,
} from '@opensearch-project/opensearch/lib/Transport.js'
import {
  context,
  SpanKind,
  SpanStatusCode,
  type Tracer,
  trace,
} from '@opentelemetry/api'
import { suppressTracing } from '@opentelemetry/core'
import {
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_QUERY_TEXT,
  ATTR_DB_SYSTEM_NAME,
} from '@opentelemetry/semantic-conventions'
import { parsePath } from './parse-path'
import { extractResponseAttributes } from './response-attributes'
import { serializeBody } from './serialize-body'
import type { OpenSearchInstrumentationConfig } from './types'

export type OriginalRequest = (
  this: Transport,
  params: TransportRequestParams,
  options?: TransportRequestOptions
) => TransportRequestPromise<ApiResponse>

type OriginalRequestWithCallback = (
  this: Transport,
  params: TransportRequestParams,
  options: TransportRequestOptions | undefined,
  callback: (err: ApiError, result: ApiResponse) => void
) => TransportRequestCallback

export const createPatchedRequest = (
  getTracer: () => Tracer,
  config: OpenSearchInstrumentationConfig = {},
  original: OriginalRequest,
  clientVersion: string
) => {
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
    const queryText = serializeBody(params, config)

    const span = getTracer().startSpan(
      [operation, index].filter(Boolean).join(' ') || params.path,
      {
        kind: SpanKind.CLIENT,
        attributes: {
          [ATTR_DB_SYSTEM_NAME]: 'opensearch',
          ...(operation && { [ATTR_DB_OPERATION_NAME]: operation }),
          ...(index && { 'db.opensearch.index': index }),
          ...(queryText && { [ATTR_DB_QUERY_TEXT]: queryText }),
        },
      }
    )
    config.requestHook?.(span, params)

    const onSuccess = (res: ApiResponse) => {
      for (const [key, value] of Object.entries(
        extractResponseAttributes(res)
      )) {
        span.setAttribute(key, value)
      }
      if (config.moduleVersionAttributeName) {
        span.setAttribute(config.moduleVersionAttributeName, clientVersion)
      }
      config.responseHook?.(span, res)
      span.end()
    }

    const onError = (err: unknown) => {
      if (err instanceof Error) span.recordException(err)
      span.setStatus({ code: SpanStatusCode.ERROR })
      span.end()
    }

    const callCtx = config.suppressInternalInstrumentation
      ? suppressTracing(context.active())
      : trace.setSpan(context.active(), span)

    if (typeof callback === 'function') {
      const originalWithCallback = (
        original as OriginalRequestWithCallback
      ).bind(this)
      return context.with(callCtx, () =>
        originalWithCallback(params, options, (err, res) => {
          err ? onError(err) : onSuccess(res)
          callback(err, res)
        })
      )
    }

    const result = context.with(callCtx, () =>
      original.call(this, params, options)
    )
    const settled = result.then(
      (res: ApiResponse) => {
        onSuccess(res)
        return res
      },
      (err: unknown) => {
        onError(err)
        throw err
      }
    )
    return Object.assign(settled, { abort: result.abort })
  }

  return patchedRequest
}
