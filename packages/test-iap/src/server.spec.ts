import http from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSocket, WebSocketServer } from 'ws'
import { introspect } from './introspection'
import { createProxyServer } from './server'
import type { ProxyConfig } from './types'

vi.mock('./introspection', () => ({
  introspect: vi.fn(
    async (_config: unknown, headers: Record<string, string>) => {
      if (headers.authorization) {
        headers.authorization = 'Introspected'
      }
      return headers
    }
  ),
}))

// helpers
const listen = (srv: http.Server) =>
  new Promise<number>((res) =>
    srv.listen(0, () => res((srv.address() as any).port))
  )
const close = (srv: http.Server) =>
  new Promise<void>((res) => srv.close(() => res()))

describe('createProxyServer (HTTP)', () => {
  let upstream: http.Server
  let proxy: http.Server
  let upstreamPort: number
  let proxyPort: number
  let lastReq: { url?: string; headers?: http.IncomingHttpHeaders } = {}

  beforeEach(async () => {
    vi.clearAllMocks()

    // upstream HTTP server (captures request)
    upstream = http.createServer((req, res) => {
      lastReq = { url: req.url, headers: req.headers }
      res.writeHead(200, { 'content-type': 'text/plain' })
      res.end('ok')
    })
    upstreamPort = await listen(upstream)

    // proxy in front of it
    const cfg: ProxyConfig = {
      target: `http://127.0.0.1:${upstreamPort}`,
      mode: 'local',
    }
    proxy = createProxyServer(cfg)
    proxyPort = await listen(proxy)
  })

  afterEach(async () => {
    await close(proxy)
    await close(upstream)
  })

  it('forwards HTTP requests and applies introspected headers', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/test/path?q=1`, {
      headers: { authorization: 'Bearer original' },
    })
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toBe('ok')

    // upstream saw full path+query
    expect(lastReq.url).toBe('/test/path?q=1')

    // introspect was invoked
    expect(introspect).toHaveBeenCalledTimes(1)

    // upstream received replaced header from introspect
    expect(lastReq.headers?.authorization).toBe('Introspected')
  })

  it('returns 502 when upstream is unavailable', async () => {
    // spin a proxy pointing to a dead port
    const deadPort = 1 // definitely unused
    const deadCfg: ProxyConfig = {
      target: `http://127.0.0.1:${deadPort}`,
      mode: 'local',
    }
    const deadProxy = createProxyServer(deadCfg)
    const deadProxyPort = await listen(deadProxy)

    const res = await fetch(`http://127.0.0.1:${deadProxyPort}/whatever`)
    const text = await res.text()

    expect(res.status).toBe(502)
    expect(text).toBe('proxy error')

    await close(deadProxy)
  })
})

describe('createProxyServer (WebSocket)', () => {
  let upstreamHttp: http.Server
  let wss: WebSocketServer
  let proxy: http.Server
  let upstreamPort: number
  let proxyPort: number
  let lastUpgradeHeaders: Record<string, string | string[] | undefined> = {}

  beforeEach(async () => {
    vi.clearAllMocks()

    // upstream HTTP+WS server
    upstreamHttp = http.createServer()
    wss = new WebSocketServer({ noServer: true })
    upstreamHttp.on('upgrade', (req, socket, head) => {
      lastUpgradeHeaders = req.headers
      wss.handleUpgrade(req, socket, head, (ws) => {
        ws.on('message', (msg) => ws.send(String(msg))) // echo
      })
    })
    upstreamPort = await listen(upstreamHttp)

    // proxy in front of it (target as ws://)
    const cfg: ProxyConfig = {
      target: `ws://127.0.0.1:${upstreamPort}`,
      mode: 'local',
    }
    proxy = createProxyServer(cfg)
    proxyPort = await listen(proxy)
  })

  afterEach(async () => {
    wss.close()
    await close(proxy)
    await close(upstreamHttp)
  })

  it('proxies WebSocket upgrade and applies introspected headers', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${proxyPort}/socket`, {
      headers: { authorization: 'Bearer original' },
    })

    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => resolve())
      ws.once('error', reject)
    })

    // send a message and expect echo from upstream
    ws.send('ping')
    const echoed = await new Promise<string>((resolve) => {
      ws.once('message', (data) => resolve(String(data)))
    })
    expect(echoed).toBe('ping')

    // introspect was invoked for upgrade
    expect(introspect).toHaveBeenCalled()

    // upstream saw the replaced Authorization header
    expect(lastUpgradeHeaders['authorization']).toBe('Introspected')
    // and the proxy ensures Upgrade/Connection/Host headers
    expect(String(lastUpgradeHeaders['upgrade']).toLowerCase()).toBe(
      'websocket'
    )
    expect(String(lastUpgradeHeaders['connection']).toLowerCase()).toContain(
      'upgrade'
    )
    expect(lastUpgradeHeaders['host']).toBe(`127.0.0.1:${upstreamPort}`)

    ws.close()
  })
})
