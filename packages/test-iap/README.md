# @sebspark/test-iap

A tiny Identity-Aware Proxy for tests. It sits in front of your HTTP/WS target during E2E and rewrites Authorization to a short‑lived RS256 JWT — either minted locally or fetched from a remote token service.

Test-only plumbing. Intentionally noisy on errors; not for production.

⸻

### Why

	•	Run E2E without wiring a real IAM stack
	•	Deterministic auth: inject claims, assert behavior
	•	Works for HTTP and WebSocket targets

### Features

	•	Proxies HTTP + WS
	•	Local mode: read Authorization: Bearer <base64url(JSON)>, mint JWT
	•	Downstream mode: call a remote GET /api/token?… and forward its JWT
	•	Claim mapping: user → preferred_username (if both exist, preferred_username wins)
	•	RS256 with kid = JWK thumbprint, iat/nbf, exp=5m

⸻

## Install

```sh
yarn add -D @sebspark/test-iap
```

⸻

## Quick start (Testcontainers)

Spin up the IAP in front of a service on your Docker network.

```ts
import { Network } from 'testcontainers'
import { TestIapContainer } from '@sebspark/test-iap'

const network = await new Network().start()

const iap = await new TestIapContainer()
  .withNetwork(network)
  .withPort(3100)                  // exposed host port
  .withTarget('http://core:3000')  // service inside the network
  .withMode('local')               // or 'downstream' with .withDownstream(...)
  .start()

const baseUrl = `http://${iap.getEndpoint()}`
```

Send requests through the IAP:

```ts
// Local mode expects Authorization to be base64url(JSON)
const claims = { sub: 'u1', user: 'alice' }
const token = Buffer.from(JSON.stringify(claims)).toString('base64url')

const res = await fetch(`${baseUrl}/orders?q=1`, {
  headers: { authorization: `Bearer ${token}` }
})
```

Your upstream will receive `Authorization: Bearer <RS256-JWT>` payload contains your claims + defaults.

⸻

## Downstream mode

Use a remote token service that returns a JWT string (response body):

```ts
const iap = await new TestIapContainer()
  .withNetwork(network)
  .withPort(3200)
  .withTarget('http://core:3000')
  .withMode('downstream')
  .withDownstream('https://issuer.example/api/token') // receives ?user=... etc.
  .start()
```

`.withMode()` is optional - inferred as 'downstream' if `.withDownstream()` is set, else 'local'

Incoming `Authorization: Bearer <base64url(JSON)>` → claims become query params to the downstream URL; its response text is used as the new JWT.

⸻

## API

Run the proxy in-process (useful for unit tests without Docker):

```ts
import {
  createProxyServer,
  type ProxyConfig,
} from '@sebspark/test-iap'

const config: ProxyConfig = {
  target: 'http://localhost:3000',
  downstream: 'https://issuer.example/api/token'
}
const server = createProxyServer(config)

const port = 3100
server.listen(3100)
```

⸻

## Auth behavior

	•	Incoming: Authorization: Bearer <access_token>
	•	Local: <access_token> must be base64url-encoded JSON
	•	Downstream: claims become URL query params
	•	Mapping:
		•	If preferred_username exists, use it
		•	Else if user exists → emit preferred_username = user and drop user
	•	Outgoing: Authorization: Bearer <jwt>
	•	RS256, kid = JWK thumbprint; iat, nbf, exp=5m

⸻

## Troubleshooting

	•	500 JSON error: the proxy returns { name, message, stack } to make debugging tests easy (by design).
	•	“remote jwt fetch failed: …”: downstream returned non‑2xx.
	•	ESM/CJS: the package publishes both; just import it.
