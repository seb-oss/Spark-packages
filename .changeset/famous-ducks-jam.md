---
"@sebspark/health-check": minor
---

`liveness()`'s `system` block now reads the container's cgroup limits (v2, with a v1 fallback) for memory and CPU when available, instead of always reporting host/node metrics from `os.*`. This fixes misleading `totalmem`/`freemem`/`memUsedRatio`/`cpus.count` values in containerized environments (e.g. Kubernetes) where the container's resource allocation is smaller than the node's.

- Added `system.resourceSource: 'cgroup' | 'host'` so consumers know which source the figures come from.
- `system.uptime` and `system.loadavg` are now only present when `resourceSource` is `'host'` — they have no meaningful cgroup equivalent and the node's load/uptime is not representative of this container. `process.uptime` (unaffected) remains the accurate uptime for this process.
- `system.cpus.count` can now be fractional (e.g. `0.5`) when `resourceSource` is `'cgroup'`, reflecting the container's actual vCPU allotment rather than the host's physical core count.
- Falls back to the previous `os.*`-based host behavior when no cgroup limits are found.
