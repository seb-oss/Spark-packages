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
      /* istanbul ignore next */
      const upstream = new URL(req.url ?? '/', toHttpBase(target))

      // let your IAP logic rewrite headers (e.g., mint/replace Authorization)
      const introspected = await introspect(config, req.headers)
      // ensure Host header matches upstream host
      if (!introspected.host) introspected.host = upstream.host

      /* istanbul ignore next */
      const upstreamPort = upstream.port || String(defaultPort(target))
      const proxyReq = httpClient.request(
        {
          protocol: upstream.protocol,
          hostname: upstream.hostname,
          port: upstreamPort,
          method: req.method,
          path: upstream.pathname + upstream.search,
          headers: introspected,
        },
        (proxyRes) => {
          /* istanbul ignore next */
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
          proxyRes.pipe(res, { end: true })
        }
      )

      proxyReq.on('error', () => {
        /* istanbul ignore else */
        if (!res.writableEnded) {
          res.writeHead(502)
          res.end('proxy error')
        }
      })

      req.pipe(proxyReq, { end: true })
    } catch (err) {
      /* istanbul ignore next */
      const errName = err instanceof Error ? err.name : 'Error'
      /* istanbul ignore next */
      const errMsg = err instanceof Error ? err.message : String(err)
      /* istanbul ignore next */
      const errStack = err instanceof Error ? err.stack : undefined
      const payload = { name: errName, message: errMsg, stack: errStack }
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end(JSON.stringify(payload))
    }
  })

  server.on('upgrade', async (req, socket, head) => {
    try {
      const introspected = await introspect(config, req.headers)
      // ensure Upgrade/Connection headers are present for WS
      /* istanbul ignore next */
      if (!hasHeader(introspected, 'upgrade'))
        setHeader(introspected, 'upgrade', 'websocket')
      /* istanbul ignore next */
      if (!hasHeader(introspected, 'connection'))
        setHeader(introspected, 'connection', 'Upgrade')
      setHeader(introspected, 'host', target.host)

      /* istanbul ignore next */
      const port = Number(target.port) || defaultPort(target)
      const upstream = net.connect(port, target.hostname, () => {
        /* istanbul ignore next */
        const wsUrl = req.url ?? '/'
        const wsBase = new URL(wsUrl, toWsBase(target))
        const lines: string[] = [
          `GET ${wsBase.pathname}${wsBase.search} HTTP/1.1`,
          `Host: ${target.host}`,
          ...flattenHeaders(introspected),
          '',
          '',
        ]
        upstream.write(lines.join('\r\n'))
        /* istanbul ignore next */
        if (head?.length) upstream.write(head)

        // bi-directional pipe
        socket.pipe(upstream).pipe(socket)
      })

      /* istanbul ignore next */
      upstream.on('error', () => socket.destroy())
      /* istanbul ignore next */
      socket.on('error', () => upstream.destroy())
    } catch (err) {
      /* istanbul ignore next */
      const errName = err instanceof Error ? err.name : 'Error'
      /* istanbul ignore next */
      const errMsg = err instanceof Error ? err.message : String(err)
      /* istanbul ignore next */
      const errStack = err instanceof Error ? err.stack : undefined
      const payload = { name: errName, message: errMsg, stack: errStack }
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
