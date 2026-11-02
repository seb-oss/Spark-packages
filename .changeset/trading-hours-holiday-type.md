---
"@sebspark/trading-hours": patch
---

`Holiday` now includes every value `whichHoliday` returns. Type assertions had hidden eight values that were already returned at runtime: `independenceDayDenmark`, `independenceDayGermany`, `pentecost`, `pentecostMonday`, `beforeGoodFriday`, `beforeEpiphany`, `beforeAscensionDay` and `beforeAllSaintsDay`. If you `switch` exhaustively over `Holiday`, TypeScript will now point out these cases.
