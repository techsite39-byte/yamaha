---
phase: "01"
slug: "live-overview-trust-gaps"
status: "partial"
nyquist_compliant: false
wave_0_complete: true
created: "2026-11-14"
updated: "2026-11-15"
---

# Phase 01 — Validation Strategy

> Focused, safe validation for the live overview. These checks do not start the
> API, access project-data stores, connect to MongoDB, or mutate business data.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner |
| **Overview contract tests** | `server/adminOverview.test.js` |
| **UI source/CSS contract tests** | `src/components/Admin/overviewUiContracts.test.js` |
| **Focused overview command** | `node --test server/adminOverview.test.js` |
| **Focused UI contract command** | `node --test src/components/Admin/overviewUiContracts.test.js` |
| **Build command** | `npm.cmd run build` |
| **Unsafe integration command** | `node --test server/index.test.js` — do not run; its cleanup/mutation behavior is not isolated from project data. |

The focused tests use in-memory values or read-only source/CSS files. No
dependencies, servers, temporary storage, or persistent fixtures are required.

## Per-Task Verification Map

| Task ID | Requirement | Automated verification | Evidence / limit | Status |
|---------|-------------|------------------------|------------------|--------|
| 01-01 Task 1 | DASH-04 | `node --test server/adminOverview.test.js` | Projection verifies confirmed zero, unavailable source, and independent source status. Does not exercise the protected HTTP endpoint. | green |
| 01-01 Task 2 | DASH-04 | `node --test server/adminOverview.test.js`; `npm.cmd run build` | Projection verifies status/read semantics, date buckets, ordering, limits, and malformed input; build verifies frontend compilation. No live storage claim. | green |
| 01-02 Task 1 | DASH-01, DASH-02 | `node --test src/components/Admin/overviewUiContracts.test.js`; `npm.cmd run build` | Source/CSS contracts verify KPI/shortcut destination declarations and the reduced-motion rule. They are not browser interaction or computed-style tests. | partial |
| 01-02 Task 2 | DASH-02, DASH-03 | `npm.cmd run build` | Build completes; Vite runtime smoke confirms the provider rejects read/status/subscription calls when demo mode is disabled. A deployed production runtime was not tested. | partial |

### Behavioral assertions in the focused suites

`server/adminOverview.test.js` checks:

- Confirmed-empty data versus failed/missing sources, including failed booking
  reads versus confirmed-empty reads for trend projection.
- Twelve UTC calendar-month buckets, recent-record ordering, and unavailable
  trends after booking-read failure.
- Explicit booking/enquiry status behavior and unread-state combinations,
  including missing and contradictory read-state fields.
- Malformed source entries/arrays making only the affected source unavailable.

`overviewUiContracts.test.js` checks the dashboard's declared shortcut/KPI
route targets, the enquiry-source empty state, and the reduced-motion CSS rule.
It reads component/CSS source; it does not simulate clicks, mount an
authenticated UI, or emulate an operating system motion preference.

## Manual-Only Verifications

| Behavior | Requirement | Why it remains manual | Instructions / expected evidence |
|----------|-------------|-----------------------|-----------------------------------|
| Auth0 login, logout, allowlist denial, and production fail-closed behavior | AUTH-01 | Requires controlled identity-provider credentials and production-like configuration. | In isolated staging, test unauthenticated, allowlisted, denied, incomplete-production-configuration, and logout cases. Confirm only the allowlisted session accesses protected data and production fails closed. |
| Authenticated overview loading, empty, partial, request-failure/retry, and refresh-freshness transitions; no polling | DASH-02 | No existing safe browser/UI test harness. These flows require authenticated UI runtime behavior, which is not inferred from source inspection or a build. | In isolated staging, exercise each response state and manual retry. Confirm failures remain visible, freshness advances only on success, and no idle polling occurs. |
| Analytics endpoint/UI distinction for failed booking reads versus confirmed-empty reads | DASH-02 | The projection distinction is automated, but the live route/UI response transition is not isolated from project stores. | In an isolated test environment, compare an endpoint response for a successful empty booking read with a failed booking read; expect empty records only in the former and unavailable/not-reported in the latter. |
| KPI card navigation and keyboard/focus behavior | DASH-01, DASH-04 | Browser clicks confirmed the Motorcycles, Bookings, Enquiries, and Activity shortcuts/panel links; KPI-card and keyboard navigation remain untested. | In the authorized admin UI, activate every KPI by pointer and keyboard and confirm each reaches its matching route with visible focus. |
| Responsive shell, keyboard/focus behavior, and rendered reduced-motion behavior | DASH-01 | Existing evidence includes a reported smoke at 390px and 1440px only; no browser test framework is installed. CSS contract test does not establish computed runtime behavior. | In browser, test keyboard/focus and widths ≤640, 641–860, 861–1024, and >1024; confirm no page-level horizontal overflow. Enable OS reduced motion and confirm the loading spinner does not animate. |
| Live MongoDB persistence | API-01, TEST-01 | No authorized live MongoDB environment is part of the safe focused test setup. | Verify only against an authorized live deployment and report the observed backend mode. JSON fallback or projection tests are not MongoDB evidence. |
| Production demo-data boundary at runtime | DASH-03 | Production build and source inspection do not exercise a deployed runtime. | In an isolated production-like deployment, confirm the normal admin route uses API data and demo/local-storage data is not exposed as business data. |

**Storage evidence boundary:** The phase summary reports JSON fallback with
`databaseConnected=false`. That is not live MongoDB persistence evidence.

## Sampling and Safety

- After overview projection changes, run `node --test server/adminOverview.test.js`.
- After overview UI/link/CSS changes, run
  `node --test src/components/Admin/overviewUiContracts.test.js`.
- After UI integration changes, run `npm.cmd run build`.
- Do not run `server/index.test.js` until its cleanup/mutation paths are
  isolated from project data.
- Do not start the API for this validation, touch MongoDB, or claim authenticated
  runtime behavior based on source/build checks.

## Validation Sign-Off

- [x] Safe automated checks are documented and runnable.
- [x] Projection gaps for explicit unread state and malformed source arrays have focused assertions.
- [x] Dashboard route declarations and reduced-motion CSS contract have focused assertions.
- [ ] Auth0, authenticated UI transitions, browser behavior, production demo runtime, and live MongoDB remain to be verified manually.
- [ ] `nyquist_compliant: true` — intentionally not set until required manual-only evidence is recorded.

**Status:** Partial automated coverage; manual checks above remain outstanding.
