import Transport from '@opensearch-project/opensearch/lib/Transport.js'
import opensearchPkg from '@opensearch-project/opensearch/package.json' with {
  type: 'json',
}
import { InstrumentationBase } from '@opentelemetry/instrumentation'
import pkg from '../package.json' with { type: 'json' }
import { createPatchedRequest, type OriginalRequest } from './patch-request'
import type { OpenSearchInstrumentationConfig } from './types'

export type { OpenSearchInstrumentationConfig } from './types'

const PACKAGE_NAME: string = pkg.name
const PACKAGE_VERSION: string = pkg.version
const OPENSEARCH_CLIENT_VERSION: string = opensearchPkg.version

export class OpenSearchInstrumentation extends InstrumentationBase {
  private readonly osConfig: OpenSearchInstrumentationConfig
  private _original: OriginalRequest | undefined

  constructor(config: OpenSearchInstrumentationConfig = {}) {
    super(PACKAGE_NAME, PACKAGE_VERSION, { ...config, enabled: false })
    this.osConfig = config
    if (config.enabled !== false) {
      this.enable()
    }
  }

  protected init() {}

  override enable() {
    if (this._original) return
    this._original = Transport.prototype.request as OriginalRequest
    Transport.prototype.request = createPatchedRequest(
      () => this.tracer,
      this.osConfig,
      this._original,
      OPENSEARCH_CLIENT_VERSION
    )
  }

  override disable() {
    if (this._original) {
      Transport.prototype.request = this._original
      this._original = undefined
    }
  }
}
