---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-11-18T02:10:35.567Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 261118 | skipped-test | server/index.test.js |  | Existing API regression tests were not run because they can write or delete records under persistent server/data and public paths; focused auth tests use temporary storage. | open |  | 2026-11-18T02:10:35.567Z |  |

````json
[
  {
    "id": 1,
    "kind": "skipped-test",
    "phase": "261118",
    "file": "server/index.test.js",
    "line": null,
    "description": "Existing API regression tests were not run because they can write or delete records under persistent server/data and public paths; focused auth tests use temporary storage.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-11-18T02:10:35.567Z",
    "resolved_at": null,
    "milestone": null
  }
]
````
