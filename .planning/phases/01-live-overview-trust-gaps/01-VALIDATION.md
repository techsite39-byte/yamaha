---
phase: "01"
slug: "live-overview-trust-gaps"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-14"
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner |
| **Config file** | `server/index.test.js`; package scripts in `package.json` |
| **Quick run command** | `node --test server/index.test.js` after tests use isolated temporary storage |
| **Full suite command** | `node --test server/index.test.js` after storage isolation, followed by `npm.cmd run build` |
| **Estimated runtime** | Not measured |

---

## Sampling Rate

- **After every task commit:** Run focused backend tests when the task changes API/data behavior; otherwise run the narrowest relevant check.
- **After every plan wave:** Run the isolated backend test suite and `npm.cmd run build`.
- **Before `/gsd-verify-work`:** Backend tests and build must be green.
- **Max feedback latency:** Not measured; establish after the isolated test harness is available.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| To assign in PLAN.md | 01 | TBD | AUTH-01 | TBD | Protected admin APIs fail closed in production | integration/security | `node --test server/index.test.js` after storage isolation | ❌ W0 | ⬜ pending |
| To assign in PLAN.md | 01 | TBD | DASH-01 | TBD | Existing route and admin shell remain protected and usable | browser/manual | Browser checks at supported responsive widths | ❌ W0 | ⬜ pending |
| To assign in PLAN.md | 01 | TBD | DASH-02 | TBD | Errors and unknown values never become success or fabricated zeroes | component/API contract | `node --test server/index.test.js` after storage isolation | ❌ W0 | ⬜ pending |
| To assign in PLAN.md | 01 | TBD | DASH-03 | TBD | Production business data comes from APIs, not demo/browser storage | source/browser smoke | `node --test server/index.test.js` after storage isolation | ❌ W0 | ⬜ pending |
| To assign in PLAN.md | 01 | TBD | DASH-04 | TBD | Metrics, trends, recent records and shortcuts use confirmed API data | API/component contract | `node --test server/index.test.js` after storage isolation | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Add isolated backend overview/API contract tests without touching project data or customer/catalogue files.
- [ ] Establish safe temporary storage and upload targets before running mutation-oriented integration tests.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive admin route, keyboard/focus behavior, navigation and logout | DASH-01 | Requires browser interaction and viewport changes | Visit `/admin`; test keyboard navigation/logout and widths ≤640, 641–860, 861–1024, and >1024; confirm no horizontal overflow. |
| Production Auth0/allowlist fail-closed behavior | AUTH-01 | Requires controlled deployment credentials and production-like configuration | Verify unauthenticated, non-allowlisted, allowlisted, and incomplete-configuration cases in an isolated staging environment; do not expose credentials or weaken development access. |
| Live MongoDB persistence | DASH-04 | This phase reads existing data and deployment/storage mode is not established by local tests | Report separately from local JSON or isolated test evidence; claim only after an authorized live database check. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
