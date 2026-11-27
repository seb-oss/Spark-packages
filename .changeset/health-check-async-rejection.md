---
"@sebspark/health-check": patch
---

A rejecting or throwing `asyncCall` now fails the check with its error, instead of leaving an unhandled rejection that could end the process.
