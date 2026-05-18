---
"@sebspark/health-check": major
---

**Breaking:** The `System` and `Process` types returned by the `/health/live` endpoint no longer include fingerprinting fields that could be exploited by an attacker.

Removed from `system`: `hostname`, `platform`, `release`, `arch`, `cpus.model`, `cpus.speedMHz`.

Removed from `process`: `pid`, `node`.

These fields were accessible without authentication and disclosed OS version, kernel release, CPU model, Node.js version, and process ID — all useful for targeted exploitation. The endpoint now only exposes load metrics: `uptime`, `loadavg`, `totalmem`, `freemem`, `memUsedRatio`, `cpus.count`, `process.uptime`, and `process.memory`.
