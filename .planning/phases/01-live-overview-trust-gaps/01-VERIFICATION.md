---
phase: 01-live-overview-trust-gaps
verified: 2026-11-15T01:54:57Z
status: human_needed
score: 5/10 must-haves verified
covered_files:
  - .planning/phases/01-live-overview-trust-gaps/01-01-PLAN.md
  - .planning/phases/01-live-overview-trust-gaps/01-01-SUMMARY.md
  - .planning/phases/01-live-overview-trust-gaps/01-02-PLAN.md
  - .planning/phases/01-live-overview-trust-gaps/01-02-SUMMARY.md
  - server/adminOverview.js
  - server/adminOverview.test.js
  - server/index.js
  - src/components/Admin/YamahaAdmin.css
  - src/components/Admin/YamahaAdmin.jsx
  - src/components/Admin/YamahaAdminDemo.jsx
  - src/components/Admin/YamahaAdminSections.jsx
  - src/components/Admin/adminDemoProvider.js
covered_digest: "v4:sha256:19405d5f23d39fbef62f06481876692e561707cf8949925bb1154b0493b658da"
behavior_unverified: 4
overrides_applied: 0
behavior_unverified_items:
  - truth: "Auth0 login, allowlist denial, production fail-closed behavior, and logout work at runtime."
    test: "Exercise allowed and denied Auth0 sessions, production missing-configuration behavior, and logout in an isolated staging environment."
    expected: "Only an authenticated allowlisted subject can use protected admin APIs; missing production auth fails closed; logout ends the session."
    why_human: "No Auth0 login, logout, or allowlist tests were performed; controlled Auth0 and production-like configuration are needed."
  - truth: "Admin overview requests distinguish loading, confirmed empty, partial/unavailable, and retryable failure states."
    test: "Exercise overview entry, confirmed-empty and partial API responses, a request failure, and retry in the browser."
    expected: "Loading, empty, unavailable, populated, and retryable error states are distinct; a failed request is never shown as success."
    why_human: "The code paths are present, but no browser test exercised the asynchronous UI transitions."
  - truth: "Overview freshness changes only after a successful manual refresh and no background polling is introduced."
    test: "Record the last-updated time, trigger a successful refresh and then a failed refresh, and leave the page idle."
    expected: "The timestamp changes only after success and does not change on failure; no periodic request occurs."
    why_human: "No test exercises the success/failure ordering or observes runtime request timing."
  - truth: "Analytics source-read failures are shown as unavailable rather than as confirmed empty data."
    test: "Cause the bookings source read to fail while the analytics endpoint remains reachable, then compare with a successful empty source."
    expected: "The failed source is reported as not reported/unavailable; only a successful empty read says there are no records."
    why_human: "The projection and response/render branches are present, but no API/UI behavior test exercises this source-failure case."
---

# Phase 1: Live Overview & Trust Gaps Verification Report

**Phase Goal:** Staff can use the existing secure admin foundation and trust its overview and production data states without replacing already-working authentication, shell, or read-only inventory.  
**Verified:** 2026-11-15T01:54:57Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Existing Auth0-backed access, allowlist enforcement, production fail-closed behavior, and logout work for authorized staff. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `server/index.js` configures Auth0 and an exact subject allowlist, protects `/api/admin/*` with `requireAdmin`, rejects unauthenticated/denied requests, and returns 503 when auth is not configured in production. The UI has session, account, and logout paths. No login/logout/allowlist runtime tests were performed. |
| 2 | The branded `/admin` shell, navigation, account controls, and responsive layout remain usable. | ? UNCERTAIN | `App.jsx` routes `/admin` to `YamahaAdmin`; source has the branded shell, navigation, account and logout controls. The reported browser smoke checked layout only at 390px and 1440px; interactions and intermediate widths were not checked. |
| 3 | Admin requests communicate loading, empty, success, and error states; failures are visible and retryable. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `YamahaAdmin.jsx` has loading/error/retry branches; overview fields use source status and `Not reported`; `YamahaAdminSections.jsx` has analytics loading/error/empty branches. No browser test exercised these transitions. |
| 4 | Production admin routes use API-backed screens and do not present demo/browser data as business data. | ✓ VERIFIED | `src/App.jsx` routes `/admin` and `/admin/*` to `YamahaAdmin`, which requests `/api/admin/session` and backend endpoints. `YamahaAdminDemo` is not imported by the application route. Demo writes/resets require `import.meta.env.DEV` plus the explicit `VITE_ADMIN_DEMO_MODE === 'true'` flag. |
| 5 | Overview KPIs, recent bookings/enquiries/activity, shortcuts, and trends use backend-returned records rather than hardcoded counts or sample activity. | ✓ VERIFIED | `YamahaAdmin.jsx` renders `pageData` from `requestJson('/api/admin/overview')`; `server/index.js` reads the existing catalog, bookings, stores and activity before calling `projectAdminOverview`. The projection tests exercise confirmed-empty, failed-source, ordering, status and trend behavior. |
| 6 | Missing or semantically undefined counts are not reported as zero, and status totals do not infer unsupported meanings. | ✓ VERIFIED | `server/adminOverview.js` returns `null` for failed/missing sources and leaves unsupported pending/completed counts `null`; the UI renders null metrics as “Not reported.” Focused tests cover failed/missing sources and unsupported status semantics. |
| 7 | Last-updated reflects successful overview requests only, and the page does not poll in the background. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `YamahaAdmin.jsx` updates `overviewUpdatedAt` only in the fulfilled request branch, on route entry/manual reload; no timer/polling is present. No behavioral test checks timestamp retention after failure or observes runtime request timing. |
| 8 | API reachability, database/storage mode, and other service status are reported as separate observed facts. | ✓ VERIFIED | `/api/admin/overview` returns `apiAvailable`, `database.connected`, `database.mode`, and unavailable media/analytics status separately; the UI labels API reachability and storage mode separately and does not claim media connectivity. |
| 9 | Analytics displays API-derived values and does not substitute fixed metrics or sample records. | ✓ VERIFIED | `AdminAnalytics` requests `/api/admin/analytics`; summary metrics and model interest come from that response/overview values, with nulls rendered as “Not reported.” No fixed sample counts or sample records are used in this view. |
| 10 | Analytics distinguishes a failed source read from a successful empty result. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Source tracing shows the analytics route returns `popularModels: null` when the bookings read failed (`server/index.js`), and the UI renders “Model interest not reported” for null versus “No model interest records yet” for an empty list. No route/UI behavior test exercises this distinction. |

**Score:** 5/10 truths verified (4 present, behavior-unverified; 1 uncertain).

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `server/adminOverview.js` | Overview projection preserving source success/failure | ✓ EXISTS + SUBSTANTIVE + WIRED | Nontrivial projection; imported and called by the protected overview and analytics routes. |
| `server/adminOverview.test.js` | Isolated projection behavior tests | ✓ EXISTS + SUBSTANTIVE + WIRED | Five active `node:test` cases use in-memory values and assert values/state; no project-data writes. |
| `server/index.js` | Protected overview and analytics endpoints | ✓ EXISTS + SUBSTANTIVE + WIRED | `/api/admin/*` middleware gates the endpoints; endpoint reads existing sources and returns projected data. |
| `src/components/Admin/YamahaAdmin.jsx` | API-backed overview and retained admin shell | ✓ EXISTS + SUBSTANTIVE + WIRED | Calls overview API, renders returned data and controls; route uses this component. |
| `src/components/Admin/YamahaAdmin.css` | Admin shell and responsive states | ✓ EXISTS + SUBSTANTIVE + WIRED | Substantive admin styling and responsive rules; visual checks are limited to the reported 390px and 1440px smoke. |
| `src/components/Admin/YamahaAdminSections.jsx` | API-backed analytics loading/empty/error states | ✓ EXISTS + SUBSTANTIVE + WIRED | Analytics component calls the analytics endpoint and renders returned values/states; interactive states not behavior-tested. |
| `src/components/Admin/adminDemoProvider.js` | Development demo data boundary | ⚠️ PRESENT; PARTIAL GUARD | Mutations/resets are guarded by development mode and opt-in. Read functions do not independently check the flag; the current production app route does not mount the demo screen. |
| `src/components/Admin/YamahaAdminDemo.jsx` | Labeled demo-only UI | ⚠️ PRESENT; NOT IN PRODUCTION ROUTER | Imports the demo provider, but is not imported by `src/App.jsx`. Its mount-time read path is not independently gated by the provider. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `server/index.js` | `server/adminOverview.js` | Protected `/api/admin/overview` projection | ✓ WIRED | Import at the top of `server/index.js`; endpoint reads sources, calls `projectAdminOverview`, and returns its fields. |
| `src/components/Admin/YamahaAdmin.jsx` | `/api/admin/overview` in `server/index.js` | `requestJson` and rendered `pageData` | ✓ WIRED | The route selects the endpoint, awaits the response into `pageData`, and renders `AdminDashboard`. |
| `src/components/Admin/YamahaAdminSections.jsx` | `/api/admin/analytics` in `server/index.js` | `requestJson` in `AdminAnalytics` | ✓ WIRED | Analytics component consumes response fields; backend computes them from successful reads and preserves unavailable values. |
| `src/components/Admin/YamahaAdminDemo.jsx` | `src/components/Admin/adminDemoProvider.js` | Imports sample-data read/write helpers | ⚠️ PARTIAL | Connected, but the read helpers do not guard on development/opt-in. Current production routing excludes this screen; the boundary depends on that exclusion. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|---|---|---|---|---|
| `YamahaAdmin.jsx` / dashboard | `pageData` and overview fields | `requestJson('/api/admin/overview')` → protected route → motorcycle/bookings/store reads → `projectAdminOverview` | Yes, from existing backend sources; source failures remain null/unavailable | ✓ FLOWING |
| `YamahaAdmin.jsx` / recent activity | `recentActivity` | `activityStore.read()` → overview projection → rendered rows | Yes; initialization entry `act-init` is filtered from the overview | ✓ FLOWING |
| `YamahaAdminSections.jsx` / analytics | `analytics`, `popularModels` | `requestJson('/api/admin/analytics')` → successful bookings read and overview projection | Yes; failed bookings read returns null `popularModels`, successful empty read returns an empty list | ✓ FLOWING (runtime distinction untested) |
| Storage status labels | `database.mode`, `database.connected` | Backend runtime state | Code reports MongoDB or local JSON fallback separately | ✓ SOURCE-WIRED; MongoDB not demonstrated |

**Storage evidence boundary:** The submitted smoke-test context reports that the local API used the JSON fallback with `databaseConnected=false`. This is JSON-fallback evidence only; it is not MongoDB persistence evidence. No live MongoDB check was performed or claimed.

## Behavioral Spot-Checks

| Behavior | Command / evidence | Result | Status |
|---|---|---|---|
| Overview projection cases | `node --test server/adminOverview.test.js` | 5 tests passed; 0 failed | ✓ PASS |
| Production bundle | `npm.cmd run build -- --outDir <temporary-directory> --emptyOutDir` | Vite transformed 77 modules and completed successfully; temporary output was removed, repository `dist` was not targeted | ✓ PASS |
| Responsive `/admin` layout | Browser smoke reported by requester | Layout only at 390px and 1440px; not independently rerun; no auth or interaction assertions | ? LIMITED |
| Local API storage mode | Smoke result reported in submitted phase context | JSON fallback, `databaseConnected=false`; not independently rerun and does not establish MongoDB | ? REPORTED ONLY |
| Auth0 login/logout/allowlist | No test performed | Runtime access behavior remains unverified | ? NOT RUN |

No server was started for this verification. The integration suite `server/index.test.js` was not run because its mutation/cleanup paths are not isolated from project data, as documented in the phase validation plan.

## Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|---|---|---:|---:|---|---|---|
| `server/adminOverview.test.js` | DASH-04, partial DASH-02 contract | 5 | 0 | No | Value and behavioral projection assertions | PASS for tested projection semantics; does not prove Auth0, HTTP route, or browser behavior |

The focused test file does not write fixtures or import the running server. No requirement-linked disabled tests or circular expected-value generation were found. Auth and browser interaction requirements have no automated tests in the inspected phase evidence.

## Probe Execution

Not applicable: these plans do not declare probes, and this is not a migration/tooling phase.

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| AUTH-01 | `01-02-PLAN.md` | Existing auth, protected admin APIs, production fail-closed authorization | ? NEEDS HUMAN | Source implements Auth0, allowlist, and 401/403/503 paths; login/logout/allowlist runtime tests were not performed. |
| DASH-01 | `01-02-PLAN.md` | Responsive branded shell, navigation, page context, account/logout | ? NEEDS HUMAN | Source paths exist; browser smoke covered only layout at 390px and 1440px, not interactions or all breakpoints. |
| DASH-02 | `01-02-PLAN.md` | Loading, empty, success and error states; failed requests not reported as success | ? NEEDS HUMAN | State branches are present and API source status is traced, but refresh/error/empty/analytics failure transitions have no browser behavior test. |
| DASH-03 | `01-02-PLAN.md` | No demo/mock/browser-only business data in production routes | ✓ SATISFIED (source-level) | `/admin` routes to `YamahaAdmin`; demo screen is not part of the production route. Demo writes/resets require development mode and explicit opt-in. |
| DASH-04 | `01-01-PLAN.md`, `01-02-PLAN.md` | Overview statistics, recent records, shortcuts and analytics are API-backed | ✓ SATISFIED (source + focused projection tests) | Endpoint/source/UI data-flow is present; tests verify projection semantics. The local JSON smoke does not establish MongoDB persistence. |

No Phase 1-mapped requirement was orphaned. REQUIREMENTS.md remains pending; this verification report does not change its status.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `src/components/Admin/adminDemoProvider.js` | 329–353 | Read helpers access in-memory/localStorage demo records without checking `DEMO_MODE_ENABLED` | ⚠️ Warning | Current production router does not mount `YamahaAdminDemo`, so no production data flow was found; provider-level read gating would make the boundary explicit and resilient to future wiring. |
| `.planning/STATE.md` / `.planning/ROADMAP.md` | — | State says phase is ready to plan/0 completed plans, and roadmap progress says Phase 1 not started, while phase summaries say complete | ℹ️ Info | Planning progress metadata is stale/inconsistent; it did not substitute for code evidence in this verification. |

No unreferenced `TBD`, `FIXME`, or `XXX` debt markers were found in the inspected phase implementation files.

## Decision Coverage

All 10 trackable decisions in `01-CONTEXT.md` were honored by the plans, summaries, or implementation artifacts. This is non-blocking.

## Human Verification Required

### 1. Auth0 access and logout

**Test:** In an isolated staging setup, log in with an allowlisted subject, attempt access with a non-allowlisted subject, test unauthenticated access, and log out. Also verify the production behavior with missing Auth0/allowlist configuration.  
**Expected:** Only the allowlisted authenticated user sees protected admin data; unauthenticated/denied sessions receive no protected data; production fails closed; logout terminates the session.  
**Why human:** No Auth0 login/logout/allowlist tests were performed; this requires controlled identity-provider and production-like configuration.

### 2. Shell, navigation, account controls, and responsive behavior

**Test:** Use keyboard and pointer navigation, account/profile and logout controls, and KPI/shortcut actions. Check widths ≤640px, 641–860px, 861–1024px, and >1024px.  
**Expected:** The Yamaha-branded shell remains usable, controls are reachable, and no page-level horizontal overflow occurs.  
**Why human:** The reported browser smoke only checked `/admin` layout at 390px and 1440px; visual and interactive behavior at other widths was not tested.

### 3. Overview request and freshness states

**Test:** Exercise route entry, successful manual refresh, confirmed empty and partial-source results, API failure, and retry. Observe the page while idle.  
**Expected:** Loading, empty, unavailable, and error states are distinct; failures remain retryable; last-updated advances only after success; no polling occurs.  
**Why human:** No browser test exercised these asynchronous state transitions or request timing.

### 4. Analytics source failure versus confirmed empty

**Test:** Compare an analytics response with a successful empty bookings source to one where the bookings source read fails while the endpoint responds.  
**Expected:** The empty case says there are no model-interest records; the failed source is “Not reported”/unavailable, not empty.  
**Why human:** Code inspection traces these distinct response values and render branches, but no API/UI behavior test exercised them.

## Gaps Summary

No definite implementation failure was found in the verified source paths. The implementation and focused projection tests support the phase goal, but completion cannot be signed off until the human checks above cover Auth0/allowlist/logout and interactive behavior. The local JSON fallback smoke is not evidence of MongoDB persistence. The overall status is therefore **human_needed**, not passed.

---
_Verified: 2026-11-15T01:54:57Z_  
_Verifier: the agent (gsd-verifier)_
