---
phase: 01-live-overview-trust-gaps
plan: 02
subsystem: ui
tags: [react, responsive, analytics, demo-boundary]

requires:
  - phase: 01-live-overview-trust-gaps
    provides: Truthful API-backed overview projection and KPI contract
provides:
  - Explicit overview request, empty, unavailable, and error states
  - API-backed analytics states without fabricated defaults
  - Development-only demo storage access
  - Responsive overview layout at mobile and desktop widths
affects: [02-motorcycles-bookings, 03-enquiries-settings, 05-analytics-responsive]

actuals:
  tokens: null
  tasks: 2
  commits: 0

tech-stack:
  added: []
  patterns:
    - API reachability and persistence mode are reported separately
    - Demo browser storage requires development mode and explicit opt-in

key-files:
  created:
    - src/components/Admin/overviewUiContracts.test.js
  modified:
    - src/components/Admin/YamahaAdmin.jsx
    - src/components/Admin/YamahaAdmin.css
    - src/components/Admin/YamahaAdminSections.jsx
    - src/components/Admin/adminDemoProvider.js

key-decisions:
  - "Do not replace missing analytics or status data with sample values."
  - "Keep local JSON fallback distinct from MongoDB persistence verification."
  - "Use a zero mobile main offset and apply the fixed-sidebar offset only at desktop widths."

patterns-established:
  - "Operational status labels reflect observed backend responses, not successful page rendering."

requirements-completed: [AUTH-01, DASH-01, DASH-02, DASH-03, DASH-04]

coverage:
  - id: D1
    description: "Overview and analytics distinguish loading, empty, partial, unavailable, and failed states."
    requirement: DASH-02
    verification:
      - kind: other
        ref: "npm.cmd run build"
        status: pass
    human_judgment: true
    rationale: "Interactive refresh, retry, and analytics response states were not exercised in an authenticated session."
  - id: D2
    description: "Production demo storage is gated by development mode and explicit opt-in."
    requirement: DASH-03
    verification:
      - kind: other
        ref: "Code inspection of src/components/Admin/adminDemoProvider.js"
        status: pass
    human_judgment: true
    rationale: "The production build was verified, but a deployed production runtime was not exercised."
  - id: D3
    description: "Overview layout does not horizontally overflow at mobile or desktop startup widths."
    requirement: DASH-01
    verification:
      - kind: automated_ui
        ref: "Browser smoke test: /admin at 390px and 1440px after page reload"
        status: pass
    human_judgment: false
  - id: D4
    description: "Existing Auth0 access, allowlist enforcement, and logout remain operational."
    requirement: AUTH-01
    verification: []
    human_judgment: true
    rationale: "Login, allowlist denial, and logout were not exercised in this run."

duration: unknown
completed: 2026-11-15
status: complete
---

# Phase 1 Plan 02: Trust States and Responsive Shell Summary

**The overview now reports observed API/storage states, avoids analytics fabrication, and fits mobile and desktop layouts.**

## Performance

- **Duration:** Not measured
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Preserved API-backed loading, empty, unavailable, and retryable error states without substituting fabricated analytics values.
- Gated demo reads, status, subscriptions, mutations, and reset operations behind development mode and explicit opt-in.
- Fixed the admin main-content offset so the mobile drawer layout starts without a desktop sidebar margin while fixed-sidebar desktop spacing remains intact.
- Disabled the overview loading spinner animation when reduced motion is requested.

## Verification

- **PASS:** `npm.cmd run build`.
- **PASS:** `node --test server/adminOverview.test.js src/components/Admin/overviewUiContracts.test.js` — 13 tests total.
- **PASS:** Browser smoke test loaded `/admin` at 390px and 1440px; page width matched the available viewport after reload, and the desktop sidebar offset was 260px.
- **PASS:** Dashboard shortcut and recent-panel links navigated to motorcycles, bookings, enquiries, and activity routes in the local browser.
- **PASS:** With demo mode disabled in Vite, all demo read/status/subscription APIs throw the expected development-only error.
- **PASS:** Local API status showed API available with JSON fallback; MongoDB was not connected.
- **PASS:** Production demo boundary is enforced at the provider read/status/subscription and write/reset entry points; production build succeeded.
- **NOT TESTED:** Auth0 login/logout and allowlist denial, interactive analytics states, live MongoDB persistence, and all later-phase CRUD modules.

## Decisions Made

- Keep analytics and persistence labels tied to actual API responses.
- Use a desktop-only sidebar offset; mobile and tablet content uses the available width.

## Deviations from Plan

- The existing worktree was already substantially modified, so token actuals could not be isolated to this plan (`actuals.tokens: null`). No unrelated changes were reverted.

## Issues Encountered

- Browser viewport resizing initially sampled a CSS transition mid-flight. Reloading at each tested width produced stable measurements and confirmed the mobile and desktop layouts.

## Next Phase Readiness

- The overview and its trust boundaries are ready for later management workflows. Human verification remains necessary for authentication and several interactive states; MongoDB persistence has not been verified.

---
*Phase: 01-live-overview-trust-gaps*
*Completed: 2026-11-15*
