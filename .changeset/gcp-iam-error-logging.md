---
"@sebspark/gcp-iam": patch
---

If token generation rejects with something other than an `Error`, that value is now logged as an `Error` with the value as its message. Previously the logger treated it as attributes, so the cause disappeared from the log message. `LruCache` no longer uses type assertions, and its behaviour is unchanged.
