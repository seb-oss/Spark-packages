---
"@sebspark/expect-eventually": patch
---

`.eventually()` now extends vitest 5's `Matchers<R, T>`. The old `Assertion<T = any>` augmentation was written for vitest 4 and caused TS2428 ("All declarations of 'Assertion' must have identical type parameters") in projects without `skipLibCheck`. The runtime walks the assertion chain without type assertions, and its behaviour is unchanged.
