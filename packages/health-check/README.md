# `@sebspark/health-check`

An easy way to add health check routes to your API.

## Features

- Exposes standard health endpoints under `/health`
  - `/health/ping` – always returns `{ status: "ok" }`
  - `/health/live` – liveness probe with system and process info
  - `/health/ready` – readiness probe with dependency checks
  - `/health` – combined view
- Supports critical and non-critical dependencies
- Throttled dependency checks to avoid overload

## Usage

```ts
import express from 'express'
import { HealthMonitor, DependencyMonitor } from '@sebspark/health-check'

const app = express()
const monitor = new HealthMonitor()

// Critical inline dependency: Database
monitor.addDependency('db', new DependencyMonitor({
  impact: 'critical',
  healthyLimitMs: 50,      // ≤ 50ms and 'ok' ⇒ ok
  timeoutLimitMs: 500,     // > 500ms ⇒ error (aborted)
  syncCall: async () => {
    try {
      const latencyMs = await db.ping() // throws on failure
      // When syncCall returns 'ok' but took > healthyLimitMs, monitor marks it 'degraded'
      return 'ok'
    } catch (err) {
      return err as Error // treated as 'error'
    }
  },
}))

// Non-critical polled dependency: External API
monitor.addDependency('externalApi', new DependencyMonitor({
  impact: 'non_critical',
  pollRate: 10_000,        // run every 10s and cache the result
  healthyLimitMs: 250,     // ≤ 250ms and 'ok' ⇒ ok
  timeoutLimitMs: 1000,    // > 1000ms ⇒ error (request times out)
  syncCall: async () => {
    try {
      const res = await fetch('https://status.example.com/health', { method: 'GET' })
      // 'ok' within healthyLimitMs ⇒ ok; 'ok' but slower ⇒ degraded; non-2xx ⇒ degraded
      return res.ok ? 'ok' : 'degraded'
    } catch (err) {
      return err as Error
    }
  },
}))

// Critical async dependency: Pub/Sub round-trip (ping/pong)
monitor.addDependency('pubsub', new DependencyMonitor({
  impact: 'critical',
  pollRate: 15_000,        // start a new async round-trip every 15s
  healthyLimitMs: 100,     // pong within 100ms ⇒ ok; slower ⇒ degraded
  timeoutLimitMs: 1000,    // no pong by 1s ⇒ error
  asyncCall: async (report) => {
    const topic = pubsub.topic('health-topic')
    const sub   = topic.subscription('health-sub')

    // listen for a single pong
    const onMessage = (msg: any) => {
      try {
        const data = JSON.parse(msg.data.toString())
        if (data.type === 'pong') {
          report('ok') // monitor classifies ok/degraded based on elapsed time
        } else {
          report('degraded')
        }
      } catch (e) {
        report(e as Error)
      } finally {
        sub.removeListener('message', onMessage)
      }
    }
    sub.on('message', onMessage)

    // publish ping
    await topic.publishMessage({ data: Buffer.from(JSON.stringify({ type: 'ping' })) })
  },
}))

app.use(monitor.router)

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

## OpenAPI specification

### JSON

```json
{
  "tags": [
    { "name": "system", "description": "Operational endpoints." }
  ],
  "paths": {
    "/health/ping": {
      "get": {
        "tags": ["system"],
        "summary": "Health ping",
        "description": "Basic health status.",
        "security": [],
        "responses": {
          "200": {
            "description": "Service responds with basic status.",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/HealthCheck_Status" }
              }
            }
          }
        }
      }
    },
    "/health/live": {
      "get": {
        "tags": ["system"],
        "summary": "Liveness",
        "description": "Liveness signal with system and process metrics.",
        "security": [],
        "responses": {
          "200": {
            "description": "Liveness payload.",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/HealthCheck_Liveness" }
              }
            }
          }
        }
      }
    },
    "/health/ready": {
      "get": {
        "tags": ["system"],
        "summary": "Readiness",
        "description": "Readiness including dependency checks and summary.",
        "security": [],
        "responses": {
          "200": {
            "description": "Readiness payload.",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/HealthCheck_ReadinessPayload" }
              }
            }
          }
        }
      }
    },
    "/health": {
      "get": {
        "tags": ["system"],
        "summary": "Comprehensive health summary",
        "description": "Combined view of status, system/process metrics, and readiness summary.",
        "security": [],
        "responses": {
          "200": {
            "description": "Health summary.",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/HealthCheck_HealthSummary" }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "HealthCheck_StatusValue": {
        "type": "string",
        "enum": ["ok", "degraded", "error"],
        "description": "Health status value."
      },
      "HealthCheck_Impact": {
        "type": "string",
        "enum": ["critical", "non_critical"],
        "description": "Operational impact if the dependency fails."
      },
      "HealthCheck_Mode": {
        "type": "string",
        "enum": ["inline", "polled", "async"],
        "description": "How the dependency is checked."
      },
      "HealthCheck_Status": {
        "type": "object",
        "properties": {
          "status": { "$ref": "#/components/schemas/HealthCheck_StatusValue" }
        },
        "required": ["status"]
      },
      "HealthCheck_System": {
        "type": "object",
        "properties": {
          "hostname": { "type": "string" },
          "platform": {
            "type": "string",
            "description": "NodeJS.Platform",
            "enum": ["aix","android","darwin","freebsd","linux","openbsd","sunos","win32"]
          },
          "release": { "type": "string" },
          "arch": { "type": "string", "description": "e.g., x64, arm64" },
          "uptime": { "type": "number", "description": "Seconds." },
          "loadavg": {
            "type": "array",
            "items": { "type": "number" },
            "minItems": 3,
            "maxItems": 3,
            "description": "Load averages for 1, 5, 15 minutes."
          },
          "totalmem": { "type": "number" },
          "freemem": { "type": "number" },
          "memUsedRatio": { "type": "number", "minimum": 0, "maximum": 1 },
          "cpus": {
            "type": "object",
            "properties": {
              "count": { "type": "integer", "minimum": 1 },
              "model": { "type": "string" },
              "speedMHz": { "type": "number" }
            },
            "required": ["count"]
          }
        },
        "required": [
          "hostname","platform","release","arch","uptime","loadavg",
          "totalmem","freemem","memUsedRatio","cpus"
        ]
      },
      "HealthCheck_MemoryUsage": {
        "type": "object",
        "description": "Process memory usage (NodeJS.MemoryUsage).",
        "properties": {
          "rss": { "type": "number" },
          "heapTotal": { "type": "number" },
          "heapUsed": { "type": "number" },
          "external": { "type": "number" },
          "arrayBuffers": { "type": "number" }
        },
        "additionalProperties": { "type": "number" }
      },
      "HealthCheck_Process": {
        "type": "object",
        "properties": {
          "pid": { "type": "integer" },
          "node": { "type": "string", "description": "Node.js version string." },
          "uptime": { "type": "number", "description": "Seconds." },
          "memory": { "$ref": "#/components/schemas/HealthCheck_MemoryUsage" }
        },
        "required": ["pid","node","uptime","memory"]
      },
      "HealthCheck_Liveness": {
        "allOf": [
          { "$ref": "#/components/schemas/HealthCheck_Status" },
          {
            "type": "object",
            "properties": {
              "timestamp": { "type": "string", "format": "date-time" },
              "system": { "$ref": "#/components/schemas/HealthCheck_System" },
              "process": { "$ref": "#/components/schemas/HealthCheck_Process" }
            },
            "required": ["timestamp","system","process"]
          }
        ]
      },
      "HealthCheck_Freshness": {
        "type": "object",
        "properties": {
          "lastChecked": { "type": "string", "format": "date-time" },
          "lastSuccess": { "type": ["string","null"], "format": "date-time" }
        },
        "required": ["lastChecked","lastSuccess"]
      },
      "HealthCheck_Observed": {
        "type": "object",
        "properties": {
          "latencyMs": { "type": ["number","null"] }
        },
        "additionalProperties": true
      },
      "HealthCheck_CheckError": {
        "type": "object",
        "properties": {
          "code": { "type": "string" },
          "message": { "type": "string" }
        },
        "required": ["code","message"]
      },
      "HealthCheck_DependencyCheck": {
        "allOf": [
          { "$ref": "#/components/schemas/HealthCheck_Status" },
          {
            "type": "object",
            "properties": {
              "impact": { "$ref": "#/components/schemas/HealthCheck_Impact" },
              "mode": { "$ref": "#/components/schemas/HealthCheck_Mode" },
              "freshness": { "$ref": "#/components/schemas/HealthCheck_Freshness" },
              "observed": { "$ref": "#/components/schemas/HealthCheck_Observed" },
              "details": { "type": "object", "additionalProperties": true },
              "error": { "oneOf": [ { "$ref": "#/components/schemas/HealthCheck_CheckError" }, { "type": "null" } ] },
              "since": { "type": ["string","null"], "format": "date-time" }
            },
            "required": ["impact","mode","freshness"]
          }
        ]
      },
      "HealthCheck_ReadinessSummary": {
        "type": "object",
        "properties": {
          "critical": {
            "type": "object",
            "properties": {
              "ok": { "type": "integer", "minimum": 0 },
              "failing": { "type": "integer", "minimum": 0 }
            },
            "required": ["ok","failing"]
          },
          "nonCritical": {
            "type": "object",
            "properties": {
              "ok": { "type": "integer", "minimum": 0 },
              "degraded": { "type": "integer", "minimum": 0 },
              "failing": { "type": "integer", "minimum": 0 }
            },
            "required": ["ok","degraded","failing"]
          },
          "degradedReasons": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["critical","nonCritical","degradedReasons"]
      },
      "HealthCheck_ReadinessPayload": {
        "allOf": [
          { "$ref": "#/components/schemas/HealthCheck_Status" },
          {
            "type": "object",
            "properties": {
              "timestamp": { "type": "string", "format": "date-time" },
              "service": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "version": { "type": "string" },
                  "instanceId": { "type": "string" }
                },
                "additionalProperties": false
              },
              "summary": { "$ref": "#/components/schemas/HealthCheck_ReadinessSummary" },
              "checks": {
                "type": "object",
                "additionalProperties": { "$ref": "#/components/schemas/HealthCheck_DependencyCheck" },
                "description": "Keyed by dependency name."
              }
            },
            "required": ["timestamp","summary","checks"]
          }
        ]
      },
      "HealthCheck_HealthSummary": {
        "allOf": [
          { "$ref": "#/components/schemas/HealthCheck_Status" },
          {
            "type": "object",
            "properties": {
              "timestamp": { "type": "string", "format": "date-time" },
              "summary": { "$ref": "#/components/schemas/HealthCheck_ReadinessSummary" },
              "checks": {
                "type": "object",
                "additionalProperties": { "$ref": "#/components/schemas/HealthCheck_DependencyCheck" }
              },
              "system": { "$ref": "#/components/schemas/HealthCheck_System" },
              "process": { "$ref": "#/components/schemas/HealthCheck_Process" }
            },
            "required": ["timestamp","summary","checks","system","process"]
          }
        ]
      }
    }
  }
}
```

### YAML

```yaml
tags:
  - name: system
    description: Operational endpoints.
paths:
  /health/ping:
    get:
      tags: [system]
      summary: Health ping
      description: Basic health status.
      security: []
      responses:
        "200":
          description: Service responds with basic status.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck_Status'
  /health/live:
    get:
      tags: [system]
      summary: Liveness
      description: Liveness signal with system and process metrics.
      security: []
      responses:
        "200":
          description: Liveness payload.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck_Liveness'
  /health/ready:
    get:
      tags: [system]
      summary: Readiness
      description: Readiness including dependency checks and summary.
      security: []
      responses:
        "200":
          description: Readiness payload.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck_ReadinessPayload'
  /health:
    get:
      tags: [system]
      summary: Comprehensive health summary
      description: Combined view of status, system/process metrics, and readiness summary.
      security: []
      responses:
        "200":
          description: Health summary.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck_HealthSummary'

components:
  schemas:
    HealthCheck_StatusValue:
      type: string
      enum: [ok, degraded, error]
      description: Health status value.

    HealthCheck_Impact:
      type: string
      enum: [critical, non_critical]
      description: Operational impact if the dependency fails.

    HealthCheck_Mode:
      type: string
      enum: [inline, polled, async]
      description: How the dependency is checked.

    HealthCheck_Status:
      type: object
      properties:
        status:
          $ref: '#/components/schemas/HealthCheck_StatusValue'
      required: [status]

    HealthCheck_System:
      type: object
      properties:
        hostname:
          type: string
        platform:
          type: string
          description: NodeJS.Platform
          enum: [aix, android, darwin, freebsd, linux, openbsd, sunos, win32]
        release:
          type: string
        arch:
          type: string
          description: e.g., x64, arm64
        uptime:
          type: number
          description: Seconds.
        loadavg:
          type: array
          items:
            type: number
          minItems: 3
          maxItems: 3
          description: Load averages for 1, 5, 15 minutes.
        totalmem:
          type: number
        freemem:
          type: number
        memUsedRatio:
          type: number
          minimum: 0
          maximum: 1
        cpus:
          type: object
          properties:
            count:
              type: integer
              minimum: 1
            model:
              type: string
            speedMHz:
              type: number
          required: [count]
      required:
        - hostname
        - platform
        - release
        - arch
        - uptime
        - loadavg
        - totalmem
        - freemem
        - memUsedRatio
        - cpus

    HealthCheck_MemoryUsage:
      type: object
      description: Process memory usage (NodeJS.MemoryUsage).
      properties:
        rss:
          type: number
        heapTotal:
          type: number
        heapUsed:
          type: number
        external:
          type: number
        arrayBuffers:
          type: number
      additionalProperties:
        type: number

    HealthCheck_Process:
      type: object
      properties:
        pid:
          type: integer
        node:
          type: string
          description: Node.js version string.
        uptime:
          type: number
          description: Seconds.
        memory:
          $ref: '#/components/schemas/HealthCheck_MemoryUsage'
      required: [pid, node, uptime, memory]

    HealthCheck_Liveness:
      allOf:
        - $ref: '#/components/schemas/HealthCheck_Status'
        - type: object
          properties:
            timestamp:
              type: string
              format: date-time
            system:
              $ref: '#/components/schemas/HealthCheck_System'
            process:
              $ref: '#/components/schemas/HealthCheck_Process'
          required: [timestamp, system, process]

    HealthCheck_Freshness:
      type: object
      properties:
        lastChecked:
          type: string
          format: date-time
        lastSuccess:
          type: [string, "null"]
          format: date-time
      required: [lastChecked, lastSuccess]

    HealthCheck_Observed:
      type: object
      properties:
        latencyMs:
          type: [number, "null"]
      additionalProperties: true

    HealthCheck_CheckError:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
      required: [code, message]

    HealthCheck_DependencyCheck:
      allOf:
        - $ref: '#/components/schemas/HealthCheck_Status'
        - type: object
          properties:
            impact:
              $ref: '#/components/schemas/HealthCheck_Impact'
            mode:
              $ref: '#/components/schemas/HealthCheck_Mode'
            freshness:
              $ref: '#/components/schemas/HealthCheck_Freshness'
            observed:
              $ref: '#/components/schemas/HealthCheck_Observed'
            details:
              type: object
              additionalProperties: true
            error:
              oneOf:
                - $ref: '#/components/schemas/HealthCheck_CheckError'
                - type: "null"
            since:
              type: [string, "null"]
              format: date-time
          required: [impact, mode, freshness]

    HealthCheck_ReadinessSummary:
      type: object
      properties:
        critical:
          type: object
          properties:
            ok:
              type: integer
              minimum: 0
            failing:
              type: integer
              minimum: 0
          required: [ok, failing]
        nonCritical:
          type: object
          properties:
            ok:
              type: integer
              minimum: 0
            degraded:
              type: integer
              minimum: 0
            failing:
              type: integer
              minimum: 0
          required: [ok, degraded, failing]
```
