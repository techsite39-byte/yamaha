# Phase 1: Live Overview & Trust Gaps - Context

**Gathered:** 2026-11-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Keep the existing authorized admin experience and make its overview, metrics, and system status truthful and API-backed. Preserve existing authentication and routes; remove production reliance on demo, mock, or browser-only data; provide clear loading, empty, success, and error states. This phase does not implement the motorcycle/booking CRUD, enquiry workflows, or content-management scope assigned to later phases.

</domain>

<decisions>
## Implementation Decisions

### Overview hierarchy
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and phase requirements
- `.planning/PROJECT.md` — project value, constraints, and admin-only boundaries.
- `.planning/REQUIREMENTS.md` — approved v1 requirements, including AUTH-01 and DASH-01 through DASH-04.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and later-phase boundaries.
- `.planning/STATE.md` — current GSD phase position and project decisions.

### Existing architecture and conventions
- `.planning/codebase/STACK.md` — React/Vite, Express, MongoDB driver, and runtime stack.
- `.planning/codebase/ARCHITECTURE.md` — admin request flow, route ownership, and store abstraction.
- `.planning/codebase/CONVENTIONS.md` — UI, API error, naming, and formatting patterns.

### Phase implementation points
- `src/components/Admin/YamahaAdmin.jsx` — admin route loading, dashboard composition, overview refresh, and analytics rendering.
- `src/components/Admin/YamahaAdminSections.jsx` — shared admin sections and analytics UI.
- `src/components/Admin/adminApi.js` — shared admin API request helper.
- `src/components/Admin/adminDemoProvider.js` and `src/components/Admin/YamahaAdminDemo.jsx` — demo-mode and browser-only data paths that must not supply production business data.
- `server/index.js` — protected overview/analytics API endpoints and backend/store status responses.

No external specs or ADRs were identified; the approved project and requirements documents define the scope.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `YamahaAdmin.jsx` already selects admin sections, loads `/api/admin/overview`, and exposes a manual refresh action.
- `adminApi.js` provides the shared request path for admin API calls.
- `server/index.js` already exposes `/api/admin/overview` and `/api/admin/analytics`; reuse their existing store and authorization boundaries.
- Existing loading, error, empty-table, and admin-shell components/styles can be extended rather than replaced wholesale.

### Established Patterns
- The application uses React state/effects and `fetch`-based API helpers, with explicit server validation and structured error responses.
- Admin persistence is abstracted behind existing MongoDB/JSON stores; local JSON fallback evidence must not be presented as live MongoDB evidence.
- The codebase uses component-scoped CSS and JavaScript/JSX; preserve current route and Auth0 behavior.

### Integration Points
- The `/admin` route and dashboard component consume `/api/admin/overview`; the analytics section also consumes `/api/admin/analytics`.
- Backend overview/analytics responses feed KPI cards, trends, recent bookings/enquiries, shortcuts, and connection status.
- The demo provider and standalone demo screen must not be used as production admin data or imply that browser-local changes persist to the backend.

</code_context>

<specifics>
## Specific Ideas

- The overview should retain the requested counts: total motorcycles; total, pending, confirmed, and completed bookings; total and unread enquiries; customer reviews; published social posts; and service videos.
- Include recent bookings, recent enquiries, recent admin activities, shortcuts, and actual API-backed analytics.
- Keep the dashboard visually restrained and readable, with the Yamaha blue/navy direction, clear spacing, and mobile stacking specified in the brief.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 1-live-overview-trust-gaps*
*Context gathered: 2026-11-14*
