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
    {
      "name": "health",
      "description": "Health endpoints."
    }
  ],
  "paths": {
    "/health": {
      "get": {
        "tags": [
          "health"
        ],
        "summary": "Comprehensive health summary",
        "description": "Combined view of status, system/process metrics, and readiness summary. Includes links to all child endpoints.",
        "security": [],
        "responses": {
          "200": {
            "description": "Health summary envelope.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthCheck_HealthSummary_Entity"
                }
              }
            }
          }
        }
      }
    },
    "/health/ping": {
      "get": {
        "tags": [
          "health"
        ],
        "summary": "Status ping",
        "description": "Basic health status. Links back to parent /health.",
        "security": [],
        "responses": {
          "200": {
            "description": "Status entity.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthCheck_Status_Entity"
                }
              }
            }
          }
        }
      }
    },
    "/health/live": {
      "get": {
        "tags": [
          "health"
        ],
        "summary": "Liveness",
        "description": "Liveness signal with system and process metrics. Links back to parent /health.",
        "security": [],
        "responses": {
          "200": {
            "description": "Liveness entity.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthCheck_Liveness_Entity"
                }
              }
            }
          }
        }
      }
    },
    "/health/ready": {
      "get": {
        "tags": [
          "health"
        ],
        "summary": "Readiness",
        "description": "Readiness including dependency checks and summary. Links back to parent /health.",
        "security": [],
        "responses": {
          "200": {
            "description": "Readiness entity.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthCheck_Readiness_Entity"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Verb": {
        "type": "string",
        "enum": [
          "GET",
          "POST",
          "PUT",
          "PATCH",
          "DELETE"
        ],
        "description": "HTTP method for the link."
      },
      "Link": {
        "type": "object",
        "description": "A hypermedia link.",
        "properties": {
          "href": {
            "type": "string",
            "format": "uri-reference",
            "description": "Target URL."
          },
          "method": {
            "$ref": "#/components/schemas/Verb"
          }
        },
        "required": [
          "href",
          "method"
        ]
      },
      "HealthCheck_StatusValue": {
        "type": "string",
        "enum": [
          "ok",
          "degraded",
          "error"
        ],
        "description": "Health status value."
      },
      "HealthCheck_Impact": {
        "type": "string",
        "enum": [
          "critical",
          "non_critical"
        ],
        "description": "Operational impact if the dependency fails."
      },
      "HealthCheck_Mode": {
        "type": "string",
        "enum": [
          "inline",
          "polled",
          "async"
        ],
        "description": "How the dependency is checked."
      },
      "HealthCheck_Status": {
        "type": "object",
        "properties": {
          "status": {
            "$ref": "#/components/schemas/HealthCheck_StatusValue"
          }
        },
        "required": [
          "status"
        ]
      },
      "HealthCheck_System": {
        "type": "object",
        "properties": {
          "hostname": {
            "type": "string"
          },
          "platform": {
            "type": "string",
            "description": "NodeJS.Platform",
            "enum": [
              "aix",
              "android",
              "darwin",
              "freebsd",
              "linux",
              "openbsd",
              "sunos",
              "win32"
            ]
          },
          "release": {
            "type": "string"
          },
          "arch": {
            "type": "string",
            "description": "e.g., x64, arm64"
          },
          "uptime": {
            "type": "number",
            "description": "Seconds."
          },
          "loadavg": {
            "type": "array",
            "items": {
              "type": "number"
            },
            "minItems": 3,
            "maxItems": 3,
            "description": "Load averages for 1, 5, 15 minutes."
          },
          "totalmem": {
            "type": "number"
          },
          "freemem": {
            "type": "number"
          },
          "memUsedRatio": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "cpus": {
            "type": "object",
            "properties": {
              "count": {
                "type": "integer",
                "minimum": 1
              },
              "model": {
                "type": "string"
              },
              "speedMHz": {
                "type": "number"
              }
            },
            "required": [
              "count"
            ]
          }
        },
        "required": [
          "hostname",
          "platform",
          "release",
          "arch",
          "uptime",
          "loadavg",
          "totalmem",
          "freemem",
          "memUsedRatio",
          "cpus"
        ]
      },
      "HealthCheck_MemoryUsage": {
        "type": "object",
        "description": "Process memory usage (NodeJS.MemoryUsage).",
        "properties": {
          "rss": {
            "type": "number"
          },
          "heapTotal": {
            "type": "number"
          },
          "heapUsed": {
            "type": "number"
          },
          "external": {
            "type": "number"
          },
          "arrayBuffers": {
            "type": "number"
          }
        },
        "additionalProperties": {
          "type": "number"
        }
      },
      "HealthCheck_Process": {
        "type": "object",
        "properties": {
          "pid": {
            "type": "integer"
          },
          "node": {
            "type": "string",
            "description": "Node.js version string."
          },
          "uptime": {
            "type": "number",
            "description": "Seconds."
          },
          "memory": {
            "$ref": "#/components/schemas/HealthCheck_MemoryUsage"
          }
        },
        "required": [
          "pid",
          "node",
          "uptime",
          "memory"
        ]
      },
      "HealthCheck_Liveness": {
        "allOf": [
          {
            "$ref": "#/components/schemas/HealthCheck_Status"
          },
          {
            "type": "object",
            "properties": {
              "timestamp": {
                "type": "string",
                "format": "date-time"
              },
              "system": {
                "$ref": "#/components/schemas/HealthCheck_System"
              },
              "process": {
                "$ref": "#/components/schemas/HealthCheck_Process"
              }
            },
            "required": [
              "timestamp",
              "system",
              "process"
            ]
          }
        ]
      },
      "HealthCheck_Freshness": {
        "type": "object",
        "properties": {
          "lastChecked": {
            "type": "string",
            "format": "date-time"
          },
          "lastSuccess": {
            "type": [
              "string",
              "null"
            ],
            "format": "date-time"
          }
        },
        "required": [
          "lastChecked",
          "lastSuccess"
        ]
      },
      "HealthCheck_Observed": {
        "type": "object",
        "properties": {
          "latencyMs": {
            "type": [
              "number",
              "null"
            ]
          }
        },
        "additionalProperties": true
      },
      "HealthCheck_CheckError": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string"
          },
          "message": {
            "type": "string"
          }
        },
        "required": [
          "code",
          "message"
        ]
      },
      "HealthCheck_DependencyCheck": {
        "allOf": [
          {
            "$ref": "#/components/schemas/HealthCheck_Status"
          },
          {
            "type": "object",
            "properties": {
              "impact": {
                "$ref": "#/components/schemas/HealthCheck_Impact"
              },
              "mode": {
                "$ref": "#/components/schemas/HealthCheck_Mode"
              },
              "freshness": {
                "$ref": "#/components/schemas/HealthCheck_Freshness"
              },
              "observed": {
                "$ref": "#/components/schemas/HealthCheck_Observed"
              },
              "details": {
                "type": "object",
                "additionalProperties": true
              },
              "error": {
                "oneOf": [
                  {
                    "$ref": "#/components/schemas/HealthCheck_CheckError"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "since": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "date-time"
              }
            },
            "required": [
              "impact",
              "mode",
              "freshness"
            ]
          }
        ]
      },
      "HealthCheck_ReadinessSummary": {
        "type": "object",
        "properties": {
          "critical": {
            "type": "object",
            "properties": {
              "ok": {
                "type": "integer",
                "minimum": 0
              },
              "failing": {
                "type": "integer",
                "minimum": 0
              }
            },
            "required": [
              "ok",
              "failing"
            ]
          },
          "nonCritical": {
            "type": "object",
            "properties": {
              "ok": {
                "type": "integer",
                "minimum": 0
              },
              "degraded": {
                "type": "integer",
                "minimum": 0
              },
              "failing": {
                "type": "integer",
                "minimum": 0
              }
            },
            "required": [
              "ok",
              "degraded",
              "failing"
            ]
          }
        },
        "required": [
          "critical",
          "nonCritical"
        ]
      },
      "HealthCheck_ReadinessPayload": {
        "allOf": [
          {
            "$ref": "#/components/schemas/HealthCheck_Status"
          },
          {
            "type": "object",
            "properties": {
              "summary": {
                "$ref": "#/components/schemas/HealthCheck_ReadinessSummary"
              },
              "dependencies": {
                "type": "object",
                "additionalProperties": {
                  "$ref": "#/components/schemas/HealthCheck_DependencyCheck"
                }
              }
            },
            "required": [
              "summary"
            ]
          }
        ]
      },
      "HealthCheck_HealthSummary": {
        "allOf": [
          {
            "$ref": "#/components/schemas/HealthCheck_Liveness"
          },
          {
            "type": "object",
            "properties": {
              "summary": {
                "$ref": "#/components/schemas/HealthCheck_ReadinessSummary"
              }
            },
            "required": [
              "summary"
            ]
          }
        ]
      },
      "HealthCheck_Status_Entity": {
        "type": "object",
        "description": "Envelope for the status (ping) resource.",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HealthCheck_Status"
          },
          "links": {
            "type": "object",
            "properties": {
              "self": {
                "$ref": "#/components/schemas/Link"
              },
              "parent": {
                "$ref": "#/components/schemas/Link"
              }
            },
            "required": [
              "self",
              "parent"
            ]
          }
        },
        "required": [
          "data",
          "links"
        ],
        "example": {
          "data": {
            "status": "ok"
          },
          "links": {
            "self": {
              "href": "/health/ping",
              "method": "GET"
            },
            "parent": {
              "href": "/health",
              "method": "GET"
            }
          }
        }
      },
      "HealthCheck_Liveness_Entity": {
        "type": "object",
        "description": "Envelope for the liveness resource.",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HealthCheck_Liveness"
          },
          "links": {
            "type": "object",
            "properties": {
              "self": {
                "$ref": "#/components/schemas/Link"
              },
              "parent": {
                "$ref": "#/components/schemas/Link"
              }
            },
            "required": [
              "self",
              "parent"
            ]
          }
        },
        "required": [
          "data",
          "links"
        ],
        "example": {
          "data": {
            "status": "ok",
            "timestamp": "2026-02-24T12:00:00Z"
          },
          "links": {
            "self": {
              "href": "/health/live",
              "method": "GET"
            },
            "parent": {
              "href": "/health",
              "method": "GET"
            }
          }
        }
      },
      "HealthCheck_Readiness_Entity": {
        "type": "object",
        "description": "Envelope for the readiness resource.",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HealthCheck_ReadinessPayload"
          },
          "links": {
            "type": "object",
            "properties": {
              "self": {
                "$ref": "#/components/schemas/Link"
              },
              "parent": {
                "$ref": "#/components/schemas/Link"
              }
            },
            "required": [
              "self",
              "parent"
            ]
          }
        },
        "required": [
          "data",
          "links"
        ],
        "example": {
          "links": {
            "self": {
              "href": "/health/ready",
              "method": "GET"
            },
            "parent": {
              "href": "/health",
              "method": "GET"
            }
          }
        }
      },
      "HealthCheck_HealthSummary_Entity": {
        "type": "object",
        "description": "Envelope for the root health summary resource. Links to all children.",
        "properties": {
          "data": {
            "$ref": "#/components/schemas/HealthCheck_HealthSummary"
          },
          "links": {
            "type": "object",
            "properties": {
              "self": {
                "$ref": "#/components/schemas/Link"
              },
              "status": {
                "$ref": "#/components/schemas/Link"
              },
              "liveness": {
                "$ref": "#/components/schemas/Link"
              },
              "readiness": {
                "$ref": "#/components/schemas/Link"
              }
            },
            "required": [
              "self",
              "status",
              "liveness",
              "readiness"
            ]
          }
        },
        "required": [
          "data",
          "links"
        ],
        "example": {
          "links": {
            "self": {
              "href": "/health",
              "method": "GET"
            },
            "status": {
              "href": "/health/ping",
              "method": "GET"
            },
            "liveness": {
              "href": "/health/live",
              "method": "GET"
            },
            "readiness": {
              "href": "/health/ready",
              "method": "GET"
            }
          }
        }
      }
    }
  }
}
```

### YAML

```yaml
tags:
  - name: health
    description: Operational endpoints.

paths:
  /health:
    get:
      tags: [health]
      summary: Comprehensive health summary
      description: Combined view of status, system/process metrics, and readiness summary. Includes links to all child endpoints.
      security: []
      responses:
        "200":
          description: Health summary envelope.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck_HealthSummary_Entity'

  /health/ping:
    get:
      tags: [health]
      summary: Status ping
      description: Basic health status. Links back to parent /health.
      security: []
      responses:
        "200":
          description: Status entity.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck_Status_Entity'

  /health/live:
    get:
      tags: [health]
      summary: Liveness
      description: Liveness signal with system and process metrics. Links back to parent /health.
      security: []
      responses:
        "200":
          description: Liveness entity.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck_Liveness_Entity'

  /health/ready:
    get:
      tags: [health]
      summary: Readiness
      description: Readiness including dependency checks and summary. Links back to parent /health.
      security: []
      responses:
        "200":
          description: Readiness entity.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck_Readiness_Entity'

components:
  schemas:

    # ─── Shared link primitives ───────────────────────────────────────────────

    Verb:
      type: string
      enum: [GET, POST, PUT, PATCH, DELETE]
      description: HTTP method for the link.

    Link:
      type: object
      description: A hypermedia link.
      properties:
        href:
          type: string
          format: uri-reference
          description: Target URL.
        method:
          $ref: '#/components/schemas/Verb'
      required: [href, method]

    # ─── Domain schemas ───────────────────────────────────────────────────────

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
      required: [critical, nonCritical]

    HealthCheck_ReadinessPayload:
      allOf:
        - $ref: '#/components/schemas/HealthCheck_Status'
        - type: object
          properties:
            summary:
              $ref: '#/components/schemas/HealthCheck_ReadinessSummary'
            dependencies:
              type: object
              additionalProperties:
                $ref: '#/components/schemas/HealthCheck_DependencyCheck'
          required: [summary]

    HealthCheck_HealthSummary:
      allOf:
        - $ref: '#/components/schemas/HealthCheck_Liveness'
        - type: object
          properties:
            summary:
              $ref: '#/components/schemas/HealthCheck_ReadinessSummary'
          required: [summary]

    # ─── Entity wrappers ──────────────────────────────────────────────────────

    HealthCheck_Status_Entity:
      type: object
      description: Envelope for the status (ping) resource.
      properties:
        data:
          $ref: '#/components/schemas/HealthCheck_Status'
        links:
          type: object
          properties:
            self:
              $ref: '#/components/schemas/Link'
            parent:
              $ref: '#/components/schemas/Link'
          required: [self, parent]
      required: [data, links]
      example:
        data:
          status: ok
        links:
          self:
            href: /health/ping
            method: GET
          parent:
            href: /health
            method: GET

    HealthCheck_Liveness_Entity:
      type: object
      description: Envelope for the liveness resource.
      properties:
        data:
          $ref: '#/components/schemas/HealthCheck_Liveness'
        links:
          type: object
          properties:
            self:
              $ref: '#/components/schemas/Link'
            parent:
              $ref: '#/components/schemas/Link'
          required: [self, parent]
      required: [data, links]
      example:
        data:
          status: ok
          timestamp: "2026-02-24T12:00:00Z"
        links:
          self:
            href: /health/live
            method: GET
          parent:
            href: /health
            method: GET

    HealthCheck_Readiness_Entity:
      type: object
      description: Envelope for the readiness resource.
      properties:
        data:
          $ref: '#/components/schemas/HealthCheck_ReadinessPayload'
        links:
          type: object
          properties:
            self:
              $ref: '#/components/schemas/Link'
            parent:
              $ref: '#/components/schemas/Link'
          required: [self, parent]
      required: [data, links]
      example:
        links:
          self:
            href: /health/ready
            method: GET
          parent:
            href: /health
            method: GET

    HealthCheck_HealthSummary_Entity:
      type: object
      description: Envelope for the root health summary resource. Links to all children.
      properties:
        data:
          $ref: '#/components/schemas/HealthCheck_HealthSummary'
        links:
          type: object
          properties:
            self:
              $ref: '#/components/schemas/Link'
            status:
              $ref: '#/components/schemas/Link'
            liveness:
              $ref: '#/components/schemas/Link'
            readiness:
              $ref: '#/components/schemas/Link'
          required: [self, status, liveness, readiness]
      required: [data, links]
      example:
        links:
          self:
            href: /health
            method: GET
          status:
            href: /health/ping
            method: GET
          liveness:
            href: /health/live
            method: GET
          readiness:
            href: /health/ready
            method: GET
```
