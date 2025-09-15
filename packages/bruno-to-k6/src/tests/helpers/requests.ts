import type { BrunoRequest } from '@usebruno/lang'

/**
 * Build a minimal BrunoRequest with required fields;
 * optional props remain undefined unless provided in `over`.
 */
export const mkReq = (over: Partial<BrunoRequest> = {}): BrunoRequest => {
  const base: BrunoRequest = {
    meta: { name: 'req', type: 'http', seq: 1 },
    http: { method: 'GET', url: 'https://example.test' },
    auth: {},
    settings: { encodeUrl: true },
  }

  return {
    ...base,
    ...over,
    meta: { ...base.meta, ...(over.meta ?? {}) },
    http: { ...base.http, ...(over.http ?? {}) },
    settings: { ...base.settings, ...(over.settings ?? {}) },
  }
}
