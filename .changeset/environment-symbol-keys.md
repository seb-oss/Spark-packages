---
"@sebspark/environment": patch
---

`initEnvironment`, its `optional` view and `initSecretStore` now return `undefined` for symbol keys instead of throwing a `TypeError`, so the proxies can be inspected and logged. `initSecretStore` now treats a fallback entry that is explicitly `undefined` as missing and throws `Secret <KEY> is required`, instead of returning `undefined`.
