<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Lead with a compact KPI snapshot. Use a primary row for motorcycles, bookings, pending work, and enquiries, followed by a compact secondary row. Keep every metric requested in the dashboard brief.
- **D-02:** Show recent bookings and recent enquiries in separate side-by-side panels on desktop and stack them on mobile.
- **D-03:** Put compact quick actions beside the page heading: Motorcycles, Bookings, and Enquiries.
- **D-04:** Make KPI cards navigate to their related admin sections; apply a relevant filter where practical.
- **D-05:** Use restrained status accents for actionable counts such as pending bookings and unread enquiries; keep general totals visually neutral.
- **D-06:** Use separate booking and enquiry trend lines on the overview chart.

### Freshness and connection status
- **D-07:** Fetch overview data on route entry and retain an explicit manual refresh action; do not add background polling in this phase. Show when the overview was last updated.
- **D-08:** Report the actual backend/storage mode and availability. Never report a database, media store, or analytics service as connected when it is unavailable or when the request failed.
- **D-09:** Keep empty datasets distinct from request failures. Zero is valid only after a successful response confirms no records; errors must remain visible and retryable.
- These freshness choices are agent-selected conservative defaults at the user's request to resolve the remaining discussion choices automatically.

### Chart range
- **D-10:** Display monthly booking and enquiry trends for the trailing 12 calendar months. Only synthesize zero-count months after a successful data query; do not replace failed or missing data with sample values.
- This chart-range choice is an agent-selected default at the user's request to resolve the remaining discussion choices automatically.

### the agent's Discretion
- Use existing admin components, request helpers, routes, and styling patterns where they fit.
- Choose accessible chart rendering, responsive breakpoints, loading presentation, and safe API implementation details, provided the approved requirements and decisions above are preserved.
- Remaining technical decisions are open to implementation judgment; do not reintroduce sample fallback data or broaden this phase into later CRUD modules.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 1 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Staff access the dashboard using the existing authentication; admin APIs remain protected and production authorization fails closed. | Preserve Auth0 and the centralized `requireAdmin` middleware; verify production fail-closed and allowlist paths without exposing dev access. [VERIFIED: .planning/REQUIREMENTS.md:10] |
| DASH-01 | The `/admin` experience has a consistent, responsive Yamaha-branded shell, navigation, page context, and account/logout controls. | Reuse the current `YamahaAdmin` shell, route map, icon component, and scoped CSS; fix inaccurate connection/status affordances without shell replacement. [VERIFIED: .planning/REQUIREMENTS.md:11] |
| DASH-02 | Admin screens show backend-driven loading, empty, success, and error states; failed requests never appear as successful saves. | Reuse `requestJson` and existing component state while distinguishing absent/malformed fields, valid zero, and request rejection. [VERIFIED: .planning/REQUIREMENTS.md:12] |
| DASH-03 | Production admin screens do not use demo records, mock data, or browser-only persistence. | Keep the `/admin` production path API-backed; keep `YamahaAdminDemo`/demo provider isolated and demo-labeled. [VERIFIED: .planning/REQUIREMENTS.md:13] |
| DASH-04 | Dashboard statistics, recent bookings and enquiries, shortcuts, and analytics reflect API-backed records rather than hardcoded counts. | Correct overview projection, use existing protected overview/analytics endpoints, and remove synthetic defaults/claims. [VERIFIED: .planning/REQUIREMENTS.md:14] |
</phase_requirements>

# Phase 1: Live Overview & Trust Gaps — Research

**Researched:** 2026-11-14  
**Domain:** React admin overview, protected Express APIs, MongoDB/JSON stores, truthful data and service states  
**Confidence:** HIGH for code structure and current implementation findings; MEDIUM for runtime data semantics and deployment state

## Summary

The existing vertical slice is already present in the working tree: the `/admin` route mounts `YamahaAdmin`, the component fetches `/api/admin/overview` after the session check, `requestJson()` centralizes same-origin JSON requests, and Express protects `/api/admin/*` (except the session endpoint) with `requireAdmin`. The backend already derives overview counts and recent records from its existing store/catalog/bookings paths, so the plan should repair and extend these contracts rather than introduce another store, a new router, or a chart package. [VERIFIED: `src/App.jsx:263-271` (`route === '/admin'` and `route.startsWith('/admin/')`); `src/components/Admin/YamahaAdmin.jsx:921-953` (`requestJson(endpoint)` and `/api/admin/overview`); `src/components/Admin/adminApi.js:1-23`; `server/index.js:916-937` (`function requireAdmin` and `app.use('/api/admin',...)`); `server/index.js:962-1071`]

The current overview still conflicts with the approved UI/data contract in important ways: it uses the wrong KPI inventory and fabricated fallbacks, only buckets six month-name labels, has no last-updated indicator, and displays fixed MongoDB/notification claims. The API itself currently labels JSON fallback as a connected generic database and reports media/analytics connected unconditionally. Treat this as a contract-correction phase: preserve the existing auth/session, routes and shell; get every displayed number/status from a successful API result; and keep failed or missing fields explicit instead of mapping them to zero or "connected." [VERIFIED: `src/components/Admin/YamahaAdmin.jsx:582-607`, `YamahaAdmin.jsx:1015-1035`, `YamahaAdmin.jsx:1128-1158`, `server/index.js:1015-1067`; code excerpts include `monthlyTrends`, `databaseConnected: true`, `mediaStorageConnected: true`, and `analyticsConnected: true`]

**Primary recommendation:** Keep the existing request flow and store boundaries; make the overview response an explicit, truthful contract for the ten approved metrics, two 12-calendar-month trend series, recent records/activity and separate API/storage availability. In the client, render only confirmed fields with the approved loading/empty/error/partial states, and use current shell/styles and inline accessible charting rather than adding dependencies. [CITED: `.planning/phases/01-live-overview-trust-gaps/01-CONTEXT.md`, Decisions D-01–D-10 and `01-UI-SPEC.md`, Interaction and Data Contract]

## Project Constraints (from copilot-instructions.md)

- Preserve the existing React/Vite/Express architecture and established API contracts. [CITED: `.github/copilot-instructions.md:13` — “Preserve the existing React/Vite/Express architecture and established API contracts.”]
- Keep existing authentication enforcement and fail-closed production behavior; do not broaden development access. [CITED: `.github/copilot-instructions.md:14` — “Keep existing authentication enforcement and fail-closed production behavior; do not broaden development access.”]
- Do not destroy or overwrite existing bookings, enquiries, catalogue records, or production data during testing. [CITED: `.github/copilot-instructions.md:15`]
- Keep changes in the admin dashboard and directly required backend support; preserve public presentation and unrelated flows. [CITED: `.github/copilot-instructions.md:16`]
- Report only tests and persistence checks actually run, and distinguish MongoDB verification from local JSON fallback. [CITED: `.github/copilot-instructions.md:17`]
- Use a GSD workflow before other file-changing actions. [CITED: `.github/copilot-instructions.md:271-273`]

The phase researcher made no application-code changes and did not run tests/builds against the working tree. Git status already showed uncommitted changes to the admin UI/server/test files and new untracked admin API/store/data files; plan and execute against that live snapshot, not an assumed clean baseline. [VERIFIED: `git status --short` in `D:\yamaha`, session probe]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authenticated overview request and all count/trend aggregation | API / Backend | Browser / Client | The backend owns authorization and reads the catalog/bookings/stores; the client renders returned data. [VERIFIED: `server/index.js:934-937`, `server/index.js:962-1067`] |
| Overview loading, partial, empty, retry/error, freshness, responsive layout and chart accessibility | Browser / Client | API / Backend | React owns display state and interaction; API response success is the prerequisite to treating zero-filled months as real. [VERIFIED: `src/components/Admin/YamahaAdmin.jsx:885-953`, `adminApi.js:1-23`] |
| Backend/storage availability status | API / Backend | Browser / Client | Only backend-observed runtime facts can substantiate MongoDB/JSON mode or service availability; UI must not infer it from page render. [VERIFIED: `server/index.js:338-348`, `server/index.js:1037-1048`] |
| Admin access control and production fail-closed behavior | API / Backend | Browser / Client | `requireAdmin` guards `/api/admin/*`; client session state is not a substitute for server-side authorization. [VERIFIED: `server/index.js:761-795`, `server/index.js:884-937`] |

## Standard Stack

### Core

| Library / runtime | Current project declaration | Purpose | Why this phase uses it |
|---|---|---|---|
| React | `"react": "^18.3.1"` and `"react-dom": "^18.3.1"` | Admin rendering/state | Existing overview and shell are React components; no replacement warranted. [VERIFIED: `package.json:23-25`] |
| Express | `"express": "^5.3.0"` | API routes and middleware | Existing protected overview/analytics endpoints and error path live in `server/index.js`. [VERIFIED: `package.json:17-18`; `server/index.js:801-937`] |
| MongoDB driver | `"mongodb": "^7.9.0"` | Optional persistent store | Existing server chooses Mongo when configured and JSON-file persistence otherwise; preserve the one-store abstraction. [VERIFIED: `package.json:22`; `server/index.js:338-348`; `server/adminStores.js:16-96`] |
| Node.js / Vite | `"node": "^20.19.0 || ^22.12.0 || >=23.0.0"`; `"vite": "^6.0.5"` | Server/runtime and frontend build | Existing project runtime/build; installed Node probe returned `v24.19.0`, npm CLI via `npm.cmd` returned `11.17.0`. [VERIFIED: `package.json:27-32`; runtime probe] |

### Supporting

| Existing project component | Purpose | Use in this phase |
|---|---|---|
| `requestJson()` | Same-origin, no-store JSON requests with credentials and non-OK errors. | Continue as the single client request path. The source reads `cache: 'no-store'`, `credentials: 'same-origin'`, and throws when `!response.ok`. [VERIFIED: `src/components/Admin/adminApi.js:1-23`] |
| `AdminIcon`, `navigation`, `pageTitles`, `YamahaAdmin.css` | Existing admin visual and navigation conventions. | Reuse for the brief's three quick links and clickable metric cards; do not add icon/chart/component packages. [VERIFIED: `src/components/Admin/YamahaAdmin.jsx:1-5`; `adminNavigation.js:1-23`; `.planning/phases/01-live-overview-trust-gaps/01-UI-SPEC.md`, Design System] |
| `createDataStore()` and existing catalog/booking readers | JSON/Mongo-compatible persistence. | Read existing sources only; no duplicate collections or browser persistence for business records. `createDataStore` exposes `read`, `write`, and `mutate`. [VERIFIED: `server/adminStores.js:16-96`] |

**Installation:** None. UI-SPEC explicitly says no component/chart/icon library and no third-party registry use; do not install packages for this phase. [CITED: `.planning/phases/01-live-overview-trust-gaps/01-UI-SPEC.md`, Design System and Registry Safety]

### Package Legitimacy Audit

Not applicable: this phase has no approved external package installation. Existing packages above are already project dependencies, not newly recommended installs. [CITED: `01-UI-SPEC.md`, Registry Safety]

## Architecture Patterns

### Data flow

```text
Browser opens /admin
  -> App mounts YamahaAdmin
  -> GET /api/admin/session
       -> auth not configured: development-only session or production 503
       -> authenticated + allowlisted: isAdmin true
       -> not authenticated / not allowlisted: false / server-side denial
  -> when session.isAdmin, GET /api/admin/overview via requestJson()
       -> requireAdmin middleware
       -> read motorcycle catalog + bookings + existing overview stores
       -> derive counts, 12-month trends, latest records/activity, runtime status
       -> success JSON -> client renders confirmed values + timestamp
       -> non-2xx / failed store read -> visible retryable error; do not synthesize data
```

`App.jsx` delegates `/admin` paths to `YamahaAdmin`; that component fetches session first, then overview for `/admin` and `/admin/analytics`. Server authorization is independent from UI state, and backend route errors flow through the common error handler. [VERIFIED: `src/App.jsx:263-271`; `src/components/Admin/YamahaAdmin.jsx:913-953`; `server/index.js:884-937`, `server/index.js:962-1071`, `server/index.js:2328-2337`]

### Recommended project structure

No new top-level structure is needed. Keep this phase localized to the existing overview and shared API contract:

- `src/components/Admin/YamahaAdmin.jsx` — `AdminDashboard`, overview state/load/retry, shell status and page heading.
- `src/components/Admin/YamahaAdmin.css` — existing admin tokens and responsive breakpoints.
- `src/components/Admin/adminApi.js` — existing `requestJson()`.
- `server/index.js` — `requireAdmin`, `/api/admin/overview`, `/api/admin/analytics`, response error mapping.
- `server/adminStores.js` — existing JSON/Mongo store abstraction and activity store.
- `server/index.test.js` or a new adjacent Node built-in test — isolated overview/auth contract tests.

These are source anchors, not a proposal to move or replace modules. [VERIFIED: source files and symbols at the line anchors above; `server/index.test.js:1-5`]

### Pattern 1: Make successful API data the only source for displayed metrics

**What:** Keep values absent until a successful request confirms them. Return and render an explicit count only if its underlying record query succeeded and the field's semantics are defined. A valid successful empty query may produce zero; a missing field or failed request remains Not reported/error. [CITED: `01-CONTEXT.md`, D-09 and `01-UI-SPEC.md`, Metric semantics]

**Current code anchor:** The client calls `requestJson('/api/admin/overview')` when the admin overview is active; `requestJson` throws on HTTP failure. The server endpoint currently gathers sources with `Promise.all` and forwards errors rather than turning a failed request into an empty overview. Preserve this failure propagation while correcting the payload/UI. [VERIFIED: `src/components/Admin/YamahaAdmin.jsx:930-953`; `src/components/Admin/adminApi.js:7-22`; `server/index.js:962-982`, `server/index.js:1068-1070`]

### Pattern 2: Preserve mode and status semantics at the API boundary

**What:** Have the backend explicitly distinguish runtime facts from business metrics and return status fields only when observed. The client should show API availability separately from storage mode. Do not equate server-side JSON fallback with MongoDB or infer media/analytics status from the overview request succeeding. [CITED: `01-CONTEXT.md`, D-08; `01-UI-SPEC.md`, System status and Metric semantics]

**Current evidence:** MongoDB absence takes the JSON-file branch in `initializeMongoDatabase()` and logs “local development is using JSON-file storage”; `createDataStore` also uses JSON files without a Mongo reference. But `/api/admin/overview` currently sets `databaseConnected: true`, `mediaStorageConnected: true`, and `analyticsConnected: true` and labels fallback `server-database-engine`. [VERIFIED: `server/index.js:338-348` and `server/index.js:1037-1048` quote `source: mongoDatabase ? 'mongodb' : 'server-database-engine'`, `databaseConnected: true`, `mediaStorageConnected: true`, `analyticsConnected: true`; `server/adminStores.js:16-59`]

### Pattern 3: Keep demo persistence isolated from live admin data

The existing demo provider has a distinct `STORAGE_KEY = 'yamaha-admin-demo-data-v1'`, uses `window.localStorage`, and explicitly labels the separate demo screen “DEMO MODE – DATA NOT SAVED”; preserve that boundary and never connect it as a fallback for the authenticated `/admin` view. Browser storage for the existing collapsed-sidebar preference is UI preference only, not a business-record source. [VERIFIED: `src/components/Admin/adminDemoProvider.js:1`, `adminDemoProvider.js:322-360`, `YamahaAdminDemo.jsx:39-46`; `YamahaAdmin.jsx:879-900`]

### Current implementation gaps to account for

| Concern | Current source evidence | Planning consequence |
|---|---|---|
| KPI inventory / semantics | `AdminDashboard` has six items with source labels `'Total Motorcycles'`, `'Total Bookings'`, `'Total Enquiries'`, `'Total Customers'`, `'Total Services'`, and `'Confirmed Orders'`; each metric is defaulted with `?? 0`. [VERIFIED: `YamahaAdmin.jsx:586-598`] | Replace with exactly the ten context/UI-spec KPIs and explicit partial/not-reported states. Do not retain fabricated customer/revenue substitutions. |
| Synthetic chart fallback | Client fallback includes the exact entries `{ month: 'Jun', bookings: 2, enquiries: 4 }` and `{ month: 'Nov', bookings: overview.totalBookings || 7, enquiries: overview.totalEnquiries || 10 }`. Backend uses `for (let i = 5; i >= 0; i--)`, month names without year, and current records. [VERIFIED: `YamahaAdmin.jsx:600-607`; `server/index.js:1015-1035`] | Remove sample fallback; compute trailing 12 calendar months only from a successful source read, use year-qualified month buckets, and expose separate lines. |
| Mapping business statuses | The backend status-count keys are `new`, `contacted`, `confirmed`, `follow-up`, `converted`, `cancelled`; the current UI treats `new` as “Pending” and has no explicit completed/unread values. [VERIFIED: `server/index.js:987-1002`, `YamahaAdmin.jsx:640-645`] | Do not map `new`→pending, `converted`→completed, or `new` enquiry→unread unless the API defines that semantic mapping. Show Not reported where no explicit definition/count exists. |
| Published counts | Current overview returns `totalSocialPosts: socialPosts.length` and `totalServiceVideos: serviceVideos.length`; it also includes `totalReviews`. [VERIFIED: `server/index.js:976-980`, `server/index.js:1049-1063`] | Ensure published-social-post count is based on explicit published records/status, not all posts; define which requested service-video/review counts include drafts before calling them published/live. |
| Recent records/activity | Current API slices bookings/enquiries/activity and the UI slices up to five/six. The activity default includes `details: 'Yamaha Production Admin Database initialized and operational.'`. [VERIFIED: `server/index.js:1061-1063`; `YamahaAdmin.jsx:766-861`; `server/adminStores.js:682-690`] | Continue using returned records only; check that seeded initialization text is not presented as recent human activity. Follow UI-spec cap/copy and show explicit empty state. |
| System status | UI shell contains `title="Connected to MongoDB Database"`, `MongoDB Connected`, and `MONGODB CONNECTED`; backend sets connected booleans true. [VERIFIED: `YamahaAdmin.jsx:1110-1158`; `server/index.js:1037-1048`] | Replace hardcoded green indicators in both shell and overview with backend-confirmed API/storage facts and Status unavailable for unconfirmed status. |
| Notifications | Header has fixed badge `3` and three fixed alert cards, unrelated to current activity. [VERIFIED: `YamahaAdmin.jsx:1158-1195`] | Remove/replace as necessary so overview does not assert fictional current alerts; the brief specifically requires API-backed recent activity and no fixed alert badge. |
| Analytics route | `AdminAnalytics` fetches `/api/admin/analytics`, swallows errors, defaults conversion to `14%`, and substitutes five hardcoded popular motorcycle counts. [VERIFIED: `YamahaAdminSections.jsx:1739-1810`] | Surface analytics request failure/empty states, remove fixed sample fallback, and keep Phase 1 analytics limited to the approved API-backed overview contract. |
| Request lifecycle | `YamahaAdmin` resets page data on route/load and tracks `loadingPage`/`pageError`; refresh increments `reloadKey`. No overview `lastUpdated` state is present in the current page-data block. [VERIFIED: `YamahaAdmin.jsx:885-953`, `YamahaAdmin.jsx:1015-1035`, `YamahaAdmin.jsx:1223-1252`] | Preserve retry mechanics; update last-updated only after a successful overview response; no polling. |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Admin auth/session enforcement | A parallel client-only auth check or new admin auth route | Existing Auth0 middleware, `/api/admin/session`, and `requireAdmin` | APIs are already centrally guarded; browser state cannot authorize data. [VERIFIED: `server/index.js:824-852`, `884-937`] |
| Business data persistence for overview | `localStorage`, sample arrays, new overview collection, duplicate endpoint store | Existing catalog readers, bookings reader, and current store objects | Avoid conflicting source-of-truth data and misleading persisted-state claims. [VERIFIED: `server/index.js:962-982`; `server/adminStores.js:16-96`] |
| Chart rendering | New charting dependency or fabricated chart dataset | Inline SVG/CSS/chart markup using existing CSS conventions | UI contract explicitly prefers existing project-supported rendering and forbids chart package addition. [CITED: `01-UI-SPEC.md`, Overview Visual Contract] |
| Status semantics | Client-side guesses from strings or zero defaults | Explicit backend counts/mapping or Not reported | `new`, `confirmed`, and `converted` are distinct stored status keys; “pending/completed/unread” need declared meaning. [VERIFIED: `server/index.js:987-1002`; cited UI-spec Metric semantics] |

**Key insight:** The server already has the source data and protected route; the costly failure here is semantic trust, not missing framework capability. Correcting server response semantics first prevents all client surfaces (KPIs, recent panels, analytics and status labels) from independently inventing truth. [VERIFIED: `server/index.js:962-1117`; `YamahaAdmin.jsx:582-861`; `YamahaAdminSections.jsx:1739-1810`]

## Common Pitfalls

1. **Treating a successful request as proof that every downstream service is connected.** `/api/admin/overview` currently returns `mediaStorageConnected: true` and `analyticsConnected: true`; current shell hardcodes MongoDB connected. Report only state supported by the corresponding server observation and separate API reachability from persistence mode. [VERIFIED: `server/index.js:1037-1048`; `YamahaAdmin.jsx:1110-1158`]
2. **Converting missing or malformed data to zero.** `?? 0`, `|| 0`, and static defaults currently conflate empty-with-confirmed with missing/error. Ensure a query success marker accompanies zero-filled data; retain confirmed fields while unavailable fields remain Not reported. [VERIFIED: `YamahaAdmin.jsx:586-607`, `YamahaAdminSections.jsx:1753-1756`; cited `01-UI-SPEC.md`, Metric semantics]
3. **Month-label collisions and wrong chart window.** Existing server buckets six recent labels using `Jan`…`Dec` without year. Use twelve chronological calendar-month keys (year + month) and generate zero buckets only after the relevant reads succeed. [VERIFIED: `server/index.js:1015-1035`; cited `01-CONTEXT.md`, D-10]
4. **Running the existing integration suite against project data.** It skips CRUD tests only when the catalog/booking JSON exists at test start, but the cleanup unlinks those paths at lines 135 and 235; the tests also mutate bookings/catalog and upload an image. Do not run that suite against live/project data without isolating its data paths. [VERIFIED: `server/index.test.js:19-21`, `54-56`, `132-136`, `139-145`, `233-237`]
5. **Over-scoping into later phases.** Keep overview counts, three shortcuts, recent records, activity, analytics and truthful system state; do not implement motorcycle/booking/enquiry CRUD, new settings, content/media work, or public-site redesign. [CITED: `.planning/phases/01-live-overview-trust-gaps/01-CONTEXT.md`, Phase Boundary and Deferred Ideas; `.planning/ROADMAP.md`, Phase 1/2 boundaries]
6. **Changing clean-looking files without respecting the dirty workspace.** Relevant source and test files are already modified/untracked. Review their current content and stage only intentional changes; do not reset, restore, or overwrite them. [VERIFIED: `git status --short`, session probe; `.github/copilot-instructions.md:15`]

## Code Examples

### Existing request pattern to preserve

The live admin overview request currently uses the shared helper and server path:

```js
requestJson('/api/admin/overview')
```

That call is verbatim from the existing route effect; preserve the shared helper's non-OK rejection path rather than adding a second raw `fetch` path. [VERIFIED: `src/components/Admin/YamahaAdmin.jsx:930-953`; `src/components/Admin/adminApi.js:7-22`]

### Existing protected route boundary

The source boundary is verbatim:

```js
app.use('/api/admin', (request, response, next) => {
  if (request.path === '/session') return next();
  return requireAdmin(request, response, next);
});
```

Overview and analytics remain behind this boundary; do not bypass it for refresh or status checks. [VERIFIED: `server/index.js:934-937`]

## Runtime State Inventory

Not a rename/refactor/migration phase; this inventory is not applicable.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback / note |
|---|---|---:|---|---|
| Node.js | Local server, test runner, Vite | Yes | `v24.19.0` | Meets the declared project range quoted in `package.json:27-29`. [VERIFIED: runtime probe; `package.json:27-29`] |
| npm CLI | Existing package scripts | Yes, via `npm.cmd` | `11.17.0` | PowerShell invocation of `npm` resolved to `npm.ps1` and was blocked by execution policy; use `npm.cmd` in this environment. [VERIFIED: runtime probe] |
| MongoDB deployment | Live Mongo persistence check | Unknown / not probed | — | Do not inspect or reveal secrets; test JSON fallback separately and report actual runtime mode. The production/runtime configuration and connection are not established by this research. [ASSUMED] |
| Auth0 deployment credentials/allowlist | Production AUTH-01 verification | Unknown / not probed | — | Keep credentials private; use a controlled deployment/staging check for 401/403/503 and allowlisted success. [ASSUMED] |

No package installation, database probe, service startup, browser session, test, or build was run. [VERIFIED: research-session actions]

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | Node built-in test runner: `import { test } from 'node:test';` [VERIFIED: `server/index.test.js:1-5`] |
| Package scripts | The source `scripts` entries are `"dev": "vite"`, `"dev:api": "node --watch server/index.js"`, `"start": "node server/index.js"`, `"build": "vite build"`, and `"preview": "vite preview"`. [VERIFIED: `package.json:6-12`] |
| Focused command | Add isolated overview contract assertions to the existing Node test workflow and run `node --test server/index.test.js` only after isolating its filesystem-backed test data and upload target. |
| Build command | `npm.cmd run build` on this PowerShell host; package script is `"build": "vite build"`. [VERIFIED: `package.json:6-12`; runtime probe] |

### Phase requirements → test map

| Req ID | Behavior to verify | Test type | Focus |
|---|---|---|---|
| AUTH-01 | Session and every protected API retain allowlist checks and production fail-closed behavior. | Integration/security | Unauthenticated, authenticated-non-allowlisted, allowlisted, incomplete/missing production config; run in isolated environment and never weaken development gate. [VERIFIED: `server/index.js:761-795`, `884-937`] |
| DASH-01 | Existing admin route, nav, account/logout, responsive shell remain functional. | Browser/manual | `/admin`, quick links, keyboard focus/logout copy, widths ≤640, 641–860, 861–1024, >1024; no public-site change. [CITED: UI-SPEC, Responsive Behavior and Authentication shell] |
| DASH-02 | Loading, successful empty, populated, partial/unreported, retryable error; no error-to-success conversion. | Component/API contract | Delayed response, empty confirmed response, omitted count, malformed response, HTTP error and network failure. |
| DASH-03 | Production overview never consumes demo records or business data from browser storage. | Build/source + browser smoke | API response is the source; demo banner/provider remain segregated; local storage sidebar preference is not a business-data source. [VERIFIED: `adminDemoProvider.js:1`, `322-360`; `YamahaAdminDemo.jsx:39-46`; `YamahaAdmin.jsx:879-900`] |
| DASH-04 | Exact ten requested metrics, two separate 12-month trend lines, status breakdown, recent bookings/enquiries/activity and quick actions all use confirmed API data. | API/component contract | Verify semantic counts, year-qualified month coverage, records returned, empty/error distinction and no hardcoded counts or sample fallback. [CITED: CONTEXT specifics and UI-SPEC acceptance criteria] |

### Recommended focused checks

- Add a safe Node `node:test` contract test around overview projection/response using synthetic fixtures in a temporary test-only location; verify all sources successful before zero-filling, and failure/missing data remains absent or error. Avoid real `server/data` and customer/catalogue files. The current backend uses fixed paths and current tests have destructive cleanup; planning should include isolation before executing mutation tests. [VERIFIED: `server/index.js:31-35`, `server/index.test.js:19-21`, `132-136`, `233-237`]
- Add endpoint assertions for API response status, exact count keys/semantics, recent record caps, month count/order, unavailable status values, and unauthorized access; exercise actual store error propagation without returning fabricated success.
- Browser-check overview first load, manual refresh success/failure, last-updated timestamp success-only, compact/secondary KPI navigation, keyboard operation, alert/live announcements, chart text equivalent, and no page-level horizontal overflow. Use the existing breakpoints quoted in CSS: `@media (max-width: 1024px)`, `860px`, and `640px`. [VERIFIED: `YamahaAdmin.css:1422-1481`]
- Run `npm.cmd run build` as a final compile check after changes. Do not claim test or persistence success unless run. MongoDB-only and local JSON evidence must be reported separately. [CITED: `.github/copilot-instructions.md:17`; `.planning/REQUIREMENTS.md:39,52`]

### Wave 0 gaps

- [ ] Add isolated backend overview/API tests. The reviewed test cases in `server/index.test.js` exercise public business settings, motorcycle CRUD, and public booking/enquiry flows; add contract coverage for the overview. [VERIFIED: `server/index.test.js:23-44,54-56,139-145`]
- [ ] Establish safe temporary storage/test harness before running existing CRUD integration tests. Existing file cleanup is unsafe against project data. [VERIFIED: `server/index.test.js:54-56`, `132-136`, `139-145`, `233-237`]
- [ ] No new test package or external dependency is needed; test framework is Node built-in. [VERIFIED: `server/index.test.js:1-5`; `package.json:13-33`]

## Security Domain

Security enforcement is enabled in planning configuration (`"security_enforcement": true`, `"security_asvs_level": 1`). This is phase-specific design guidance, not a security certification. [VERIFIED: `.planning/config.json:49-51`]

### Applicable ASVS categories

| ASVS category | Applies | Phase control |
|---|---|---|
| V2 Authentication | Yes | Preserve Auth0 session and existing authorized-user gate; do not add demo access to production. [VERIFIED: `server/index.js:761-795`, `884-913`] |
| V3 Session Management | Yes | Keep the current session cookie flags and lifetime; do not bypass existing middleware. Source includes `httpOnly: true`, `sameSite: 'Lax'`, `secure: production`. [VERIFIED: `server/index.js:841-850`] |
| V4 Access Control | Yes | Keep centralized `/api/admin` authorization; session endpoint is a status endpoint, not authorization for data APIs. [VERIFIED: `server/index.js:916-937`] |
| V5 Input Validation | Limited | Overview is read-only; validate/normalize any added query parameters and keep error output safe. [VERIFIED: `server/index.js:962-1071`, `2328-2337`] |
| V6 Cryptography | No new phase-specific crypto | Continue using existing Auth0/session mechanisms; do not hand-roll tokens or encryption. [VERIFIED: `server/index.js:824-852`] |

### Known threat patterns

| Pattern | STRIDE | Mitigation |
|---|---|---|
| Direct requests to admin data routes by unauthenticated/non-allowlisted users | Elevation of privilege | Keep `requireAdmin`; test server-side 401/403 and production 503 fail-closed paths. [VERIFIED: `server/index.js:916-937`] |
| UI labels report MongoDB/service connection regardless of actual mode/failure | Spoofing / repudiation of operational state | Render observed backend status only; unknown/unobserved is “Status unavailable.” [VERIFIED: `server/index.js:1037-1048`; `YamahaAdmin.jsx:1110-1158`; cited UI-SPEC] |
| Server exceptions accidentally converted into zeros/sample metrics | Tampering / information integrity | Preserve failed response path; no fake defaults; test fail/empty separately. [VERIFIED: `server/index.js:1068-1070`, `2328-2337`; `adminApi.js:16-22`] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | The production deployment may or may not have MongoDB, Auth0 allowlist, media storage, or analytics configured; no live deployment was probed. | Environment Availability | Could overstate runtime availability or claim unverified persistence. |
| A2 | [ASSUMED] Current booking/enquiry business statuses do not define pending/completed/unread equivalences beyond the exact keys returned by code; do not add a mapping unless the API contract or approved semantics establishes one. | Current implementation gaps | Wrong mappings misstate actionable work and mislead staff. |
| A3 | [ASSUMED] The selected date field and interpretation for monthly trends should remain the backend's business-record creation time; no alternate timezone/reporting rule was found in the approved phase documents. | Chart/trend handling | Month boundary differences can shift reported counts; keep a single explicit server rule and test boundaries. |
| A4 | [ASSUMED] Which reviews/service videos count as the requested “customer reviews” and “service videos,” and how “published social posts” are distinguished, is not fully established by the current count response. | Current implementation gaps | KPI names could imply published/approved counts while including drafts or unmoderated records. |
| A5 | [ASSUMED] Existing activity seed text may be returned as if it were recent activity when the activity store is initialized from defaults. | Recent records/activity | A system initialization seed could be mistaken for an actual human/admin event. |

## Open Questions / Unresolved Evidence

1. **What is the exact runtime storage/service mode in the target deployment?** Source code supports Mongo and JSON files, but no deployment/env/connection probe was made. Plan backend-reported mode and “Status unavailable” on missing status; collect separate Mongo and JSON evidence at verification time. [ASSUMED]
2. **What API-defined semantics constitute pending booking, completed booking, unread enquiry, and published counts?** Existing server keys do not expose all requested names explicitly. Do not infer; have the plan emit explicit fields only where definition is supported, otherwise display Not reported and keep the distinction visible. [VERIFIED: `server/index.js:987-1002`, `1049-1063`; cited UI-SPEC Metric semantics]
3. **Does overview “success” require every backing source or can some fields be partial?** Existing endpoint uses one `Promise.all`, so any rejection fails the full endpoint; the UI spec requires partial fields to remain readable. Preserve truthful failures and choose/document a source-level partial-response contract rather than silently defaulting unavailable fields. [VERIFIED: `server/index.js:964-982`; cited UI-SPEC partial/error states]
4. **Is current activity seed content an operational event or a placeholder?** `defaultActivityLogs` seeds one generic startup message, while current activity data files are not audited here to avoid reading local business records. Filter/label the known seed appropriately or ensure only actual recorded events appear; do not inspect or expose customer data during planning. [VERIFIED: `server/adminStores.js:682-690`; `git status --short` indicates local activity data exists but content not read]
5. **How should unauthenticated/non-admin session results transition in the browser?** Current component fetches session and only starts page-data loading if `session?.isAdmin`; server routes remain authoritative. Preserve approved auth behavior and include a browser check that no protected data renders for false/non-admin session results. [VERIFIED: `YamahaAdmin.jsx:913-953`; `server/index.js:884-937`]

## Sources

### Primary (HIGH confidence, current repository evidence)

- `.planning/phases/01-live-overview-trust-gaps/01-CONTEXT.md` — locked behavior, metric inventory, state, freshness, status, and chart rules.
- `.planning/phases/01-live-overview-trust-gaps/01-UI-SPEC.md` — visual/interaction contract, responsive states, labels, accessible chart, no new dependencies.
- `.planning/REQUIREMENTS.md:10-14` — exact Phase 1 requirements.
- `.planning/STATE.md` and `.planning/ROADMAP.md` — current active phase and later-phase scope.
- `.github/copilot-instructions.md:13-17,271-273` — project constraints and GSD workflow directive.
- `src/App.jsx:263-271`; `src/components/Admin/YamahaAdmin.jsx:582-607,871-953,1015-1035,1110-1252`; `src/components/Admin/YamahaAdminSections.jsx:1739-1810`; `src/components/Admin/adminApi.js:1-23`; `src/components/Admin/adminNavigation.js:1-23`.
- `server/index.js:338-348,761-795,884-937,962-1117,2328-2360`; `server/adminStores.js:16-96,682-719`; `server/index.test.js:1-5,19-21,54-56,132-145,233-237`.
- `package.json:6-35`; `src/components/Admin/YamahaAdmin.css:648-778,1422-1481`.

No external documentation or package lookup was needed: the phase is explicitly a codebase-specific extension of the existing implementation and the UI contract prohibits adding third-party UI/chart packages. [CITED: `01-UI-SPEC.md`, Design System and Registry Safety]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — current project metadata/source files were opened; no new dependencies recommended.
- Architecture: HIGH — frontend route, request lifecycle, auth boundary, endpoint, and stores were read directly in this session.
- Pitfalls: HIGH for hardcoded/fallback behaviors present in source; MEDIUM for deployment/runtime service availability and unresolved business status semantics.

**Research date:** 2026-11-14  
**Valid until:** 2026-12-14 for this repository-anchored guidance; recheck source and runtime before implementation if the working tree changes.
