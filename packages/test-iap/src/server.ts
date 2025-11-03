import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { introspect } from './introspection'
import type { ProxyConfig } from './types'
import {
  defaultPort,
  flattenHeaders,
  hasHeader,
  setHeader,
  toHttpBase,
  toWsBase,
} from './utils'

export const createProxyServer = (config: ProxyConfig) => {
  if (!config.target)
    throw new Error(
      'config.target must be set, e.g. http://core:3000 or ws://gateway:4000'
    )

  const target = new URL(config.target)

  const httpClient =
    target.protocol === 'https:' || target.protocol === 'wss:' ? https : http

  const server = http.createServer(async (req, res) => {
    try {
      // compute upstream URL (preserve path+query)
      const upstream = new URL(req.url ?? '/', toHttpBase(target))

      // let your IAP logic rewrite headers (e.g., mint/replace Authorization)
      const introspected = await introspect(config, req.headers)
      // ensure Host header matches upstream host
      if (!introspected.host) introspected.host = upstream.host

      const proxyReq = httpClient.request(
        {
          protocol: upstream.protocol,
          hostname: upstream.hostname,
          port: upstream.port || String(defaultPort(target)),
          method: req.method,
          path: upstream.pathname + upstream.search,
          headers: introspected,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
          proxyRes.pipe(res, { end: true })
        }
      )

      proxyReq.on('error', () => {
        if (!res.writableEnded) {
          res.writeHead(502)
          res.end('proxy error')
        }
      })

      req.pipe(proxyReq, { end: true })
    } catch (err) {
      const payload = {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end(JSON.stringify(payload))
    }
  })

  server.on('upgrade', async (req, socket, head) => {
    try {
      const introspected = await introspect(config, req.headers)
      // ensure Upgrade/Connection headers are present for WS
      if (!hasHeader(introspected, 'upgrade'))
        setHeader(introspected, 'upgrade', 'websocket')
      if (!hasHeader(introspected, 'connection'))
        setHeader(introspected, 'connection', 'Upgrade')
      setHeader(introspected, 'host', target.host)

      const port = Number(target.port) || defaultPort(target)
      const upstream = net.connect(port, target.hostname, () => {
        const wsBase = new URL(req.url ?? '/', toWsBase(target))
        const lines: string[] = [
          `GET ${wsBase.pathname}${wsBase.search} HTTP/1.1`,
          `Host: ${target.host}`,
          ...flattenHeaders(introspected),
          '',
          '',
        ]
        upstream.write(lines.join('\r\n'))
        if (head?.length) upstream.write(head)

        // bi-directional pipe
        socket.pipe(upstream).pipe(socket)
      })

      upstream.on('error', () => socket.destroy())
      socket.on('error', () => upstream.destroy())
    } catch (err) {
      const payload = {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }
      const body = Buffer.from(JSON.stringify(payload))
      socket.write(
        `HTTP/1.1 500 Internal Server Error
Connection: close
Content-Type: application/json
Content-Length: ${body.length}
`
      )
      socket.write(body)
      socket.destroy()
    }
  })

  return server
}
