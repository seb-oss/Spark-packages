import assert from 'node:assert'
import { createProxyServer } from './server'
import type { ProxyConfig } from './types'

// Read env and normalize the listen port
const { PORT, TARGET, MODE, DOWNSTREAM } = process.env
const port = PORT && !Number.isNaN(Number(PORT)) ? Number(PORT) : 3000

// TARGET must be an absolute URL (http/https/ws/wss)
assert(TARGET, 'TARGET must be set')
let targetUrl: URL
try {
  targetUrl = new URL(TARGET as string)
} catch {
  throw new Error(
    'TARGET must be an absolute URL, e.g. http://core:3000 or ws://gateway:4000'
  )
}
const allowedTargetProtocols = new Set(['http:', 'https:', 'ws:', 'wss:'])
assert(
  allowedTargetProtocols.has(targetUrl.protocol),
  'TARGET must start with http(s):// or ws(s)://'
)

// Resolve mode:
// - explicit MODE wins if valid
// - otherwise infer: DOWNSTREAM set → downstream, else local
let resolvedMode: 'local' | 'downstream'
if (MODE === 'local' || MODE === 'downstream') {
  resolvedMode = MODE
} else {
  resolvedMode = DOWNSTREAM ? 'downstream' : 'local'
}

// If downstream mode, validate DOWNSTREAM is an absolute https? URL
let downstreamUrl: string | undefined
if (resolvedMode === 'downstream') {
  assert(
    DOWNSTREAM,
    'DOWNSTREAM must be set when MODE=downstream (or when inferred)'
  )
  try {
    const u = new URL(DOWNSTREAM as string)
    const allowedDownstreamProtocols = new Set(['http:', 'https:'])
    assert(
      allowedDownstreamProtocols.has(u.protocol),
      'DOWNSTREAM must start with http(s)://'
    )
    downstreamUrl = u.toString()
  } catch {
    throw new Error(
      'DOWNSTREAM must be an absolute URL, e.g. https://jwks.example.com/api/token'
    )
  }
}

// Build proxy config consumed by the server
const config: ProxyConfig = {
  target: targetUrl.toString(),
  mode: resolvedMode,
  downstream: downstreamUrl ?? '',
}

// Start the proxy server
const server = createProxyServer(config)
server.listen(port, () => {
  console.log(`IAP listening on :${port} → ${config.target} (${config.mode})`)
})
