import type { UndiciInstrumentationConfig } from '@opentelemetry/instrumentation-undici'
import {
  applyRequestAttributes,
  applyResponseAttributes,
} from './apply-attributes'
import { resolve } from './helpers'
import { normUndiciRequest, normUndiciResponse } from './normalize-undici'
import type { OutgoingHttpEnrichmentConfig } from './types'

/**
 * Build an UndiciInstrumentationConfig that applies shared enrichment logic.
 *
 *   new UndiciInstrumentation(buildUndiciConfig(opts))
 */
export function buildUndiciConfig(
  opts: OutgoingHttpEnrichmentConfig = {}
): UndiciInstrumentationConfig {
  const cfg = resolve(opts)

  const config: UndiciInstrumentationConfig = {
    ignoreRequestHook(req) {
      if (!cfg.ignoreOutgoingPaths.length) return false
      const path = req.path ?? ''
      return cfg.ignoreOutgoingPaths.some((p) =>
        path.toLowerCase().startsWith(p.toLowerCase())
      )
    },

    // undici collapses startSpanHook + requestHook into a single requestHook
    // because diagnostics_channel gives us everything at once.
    requestHook(span, request) {
      applyRequestAttributes(span, normUndiciRequest(request), cfg)
    },

    responseHook(span, { response }) {
      applyResponseAttributes(span, normUndiciResponse(response), cfg)
    },
  }

  return config
}
