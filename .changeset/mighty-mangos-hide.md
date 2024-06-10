---
"@sebspark/openapi-client": patch
---

Fixes a bug where a GET request gets sent with the Content-Length header set to 2, because data is {}. This causes a problem with some load balancers.
