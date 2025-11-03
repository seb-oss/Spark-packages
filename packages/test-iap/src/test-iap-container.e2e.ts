import { GenericContainer, Network, type StartedNetwork } from 'testcontainers'
// src/test-iap-container.spec.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { TestIapContainer } from './test-iap-container'

// --- helpers ---
const waitHttpOk = (url: string, timeoutMs = 10000) =>
  new Promise<void>((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      fetch(url)
        .then(() => resolve())
        .catch((err) => {
          if (Date.now() - start > timeoutMs) reject(err)
          else setTimeout(tick, 150)
        })
    }
    tick()
  })

describe('TestIapContainer', () => {
  let network: StartedNetwork

  beforeAll(async () => {
    network = await new Network().start()
  }, 60_000)

  afterAll(async () => {
    await network.stop()
  })

  it('starts and proxies HTTP in local mode (minted JWT replaces base64url token)', async () => {
    // 1) Upstream container that echos request headers as JSON
    const upstream = await new GenericContainer('node:22-alpine')
      .withNetwork(network)
      .withNetworkAliases('upstream')
      .withExposedPorts(3000)
      .withCommand([
        'node',
        '-e',
        // tiny echo server => { headers, url }
        `require('http').createServer((req,res)=>{let b='';
          req.on('data',d=>b+=d);
          req.on('end',()=>{
            res.setHeader('content-type','application/json');
            res.end(JSON.stringify({headers:req.headers, url:req.url}));
          });
        }).listen(3000,'0.0.0.0')`,
      ])
      .start()

    try {
      // 2) IAP in front of it (LOCAL mode)
      const iap = await new TestIapContainer()
        .withNetwork(network)
        .withPort(3100)
        .withTarget('http://upstream:3000')
        .withMode('local')
        .start()

      try {
        const baseUrl = `http://${iap.getEndpoint()}`
        await waitHttpOk(baseUrl) // wait until IAP is listening

        // Access token must be base64url(JSON) for local mode
        const claims = { sub: 'u1', user: 'alice' }
        const token = Buffer.from(JSON.stringify(claims)).toString('base64url')

        const res = await fetch(`${baseUrl}/echo?q=1`, {
          headers: { authorization: `Bearer ${token}` },
        })

        // helpful debug when it fails
        if (!res.ok) {
          console.error('IAP non-200:', res.status, await res.text())
        }
        expect(res.status).toBe(200)

        const body = (await res.json()) as {
          headers: Record<string, string>
          url: string
        }

        // Path & query preserved
        expect(body.url).toBe('/echo?q=1')

        // Authorization should be replaced with a JWT (3 segments)
        const auth = body.headers.authorization
        expect(auth).toMatch(/^Bearer [^.]+\.[^.]+\.[^.]+$/)

        // Should NOT still be the base64url token we sent
        expect(auth).not.toContain(token)
      } finally {
        await (await iap).stop()
      }
    } finally {
      await upstream.stop()
    }
  }, 120_000)

  it('proxies HTTP in downstream mode (uses remote token)', async () => {
    // 1) Downstream token service container
    const downstream = await new GenericContainer('node:22-alpine')
      .withNetwork(network)
      .withNetworkAliases('downstream')
      .withExposedPorts(4000)
      .withCommand([
        'node',
        '-e',
        // responds with a fixed token regardless of query
        `require('http').createServer((req,res)=>{
          res.writeHead(200,{'content-type':'text/plain'});
          res.end('downstream-token');
        }).listen(4000,'0.0.0.0')`,
      ])
      .start()

    // 2) Upstream app (echo headers)
    const upstream = await new GenericContainer('node:22-alpine')
      .withNetwork(network)
      .withNetworkAliases('upstream2')
      .withExposedPorts(3000)
      .withCommand([
        'node',
        '-e',
        `require('http').createServer((req,res)=>{
          res.setHeader('content-type','application/json');
          res.end(JSON.stringify({headers:req.headers}));
        }).listen(3000,'0.0.0.0')`,
      ])
      .start()

    try {
      // 3) IAP (DOWNSTREAM mode)
      const iap = await new TestIapContainer()
        .withNetwork(network)
        .withPort(3200)
        .withTarget('http://upstream2:3000')
        .withMode('downstream')
        .withDownstream('http://downstream:4000/api/token')
        .start()

      try {
        const baseUrl = `http://${iap.getEndpoint()}`
        await waitHttpOk(baseUrl)

        const claims = { user: 'bob' }
        const token = Buffer.from(JSON.stringify(claims)).toString('base64url')

        const res = await fetch(baseUrl, {
          headers: { authorization: `Bearer ${token}` },
        })
        const body = (await res.json()) as { headers: Record<string, string> }

        // Downstream token should be passed through as Bearer
        expect(body.headers.authorization).toBe('Bearer downstream-token')
      } finally {
        await (await iap).stop()
      }
    } finally {
      await downstream.stop()
      await upstream.stop()
    }
  }, 120_000)
})
