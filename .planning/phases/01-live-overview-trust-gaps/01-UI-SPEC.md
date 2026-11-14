---
phase: "1"
slug: "live-overview-trust-gaps"
status: verified
shadcn_initialized: false
preset: none
created: "2026-11-14"
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for the admin-only Live Overview & Trust Gaps phase. Source of truth: approved phase context and the existing Yamaha admin shell and CSS; no external design research was used.

## Design System

| Property | Value |
|----------|-------|
| Tool | none — manual, existing CSS design system |
| Preset | not applicable |
| Component library | none; reuse existing React components and component-scoped CSS |
| Icon library | Existing `AdminIcon` SVG component; do not add an icon package |
| Font | Manrope for dashboard UI; Barlow Condensed only for the existing Yamaha wordmark |

Preserve the current `YamahaAdmin.jsx` route/Auth0 shell and `YamahaAdmin.css` tokens. Do not initialize shadcn or add a component library. Keep this phase to the `/admin` overview and the three already-existing admin destinations it links to; do not redesign public pages or implement later-phase CRUD.

### Existing design tokens to reuse

| Token | Existing value | Application |
|-------|----------------|-------------|
| `--admin-primary` | `#0879D1` | Yamaha-blue primary action, active navigation, and reserved chart series |
| `--admin-primary-hover` | `#0665B0` | Hover/pressed primary action |
| `--admin-dark-bg` | `#080D16` | Dark shell context and overlay |
| `--admin-sidebar-bg` | `#0C1422` | Persistent desktop sidebar and mobile drawer |
| `--admin-content-bg` | `#F4F7FB` | Main overview canvas |
| `--admin-card-bg` | `#FFFFFF` | KPI cards and data panels |
| `--admin-card-border` | `#E2E8F0` | Card, panel, and table boundaries |
| `--admin-text-main` | `#172033` | Primary text |
| `--admin-text-muted` | `#748197` | Supporting labels and metadata |
| `--admin-green` / `--admin-amber` / `--admin-red` | `#10B981` / `#F59E0B` / `#EF4444` | Confirmed positive / pending / error states, paired with text labels |

## Spacing Scale

Declared values follow a 4px base, compatible with the existing admin spacing tokens and layout.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gaps and compact inline spacing |
| sm | 8px | Compact control and badge spacing |
| md | 16px | Standard card/grid gaps and control padding |
| lg | 24px | Panel padding and overview section spacing |
| xl | 32px | Larger layout separations |
| 2xl | 48px | Major content breaks |
| 3xl | 64px | Page-level separation, only where the existing shell allows |

Exceptions: none. Interactive controls must retain at least a 44px hit area on touch layouts; this is a target size, not an additional spacing token.

## Typography

Use Manrope and exactly these four UI sizes and two weights in this phase. Barlow Condensed remains restricted to the existing brand mark and is not an additional dashboard text style.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Supporting text / labels | 12px | 700 | 1.3 |
| Body / table content | 14px | 400 | 1.5 |
| Panel headings | 20px | 700 | 1.2 |
| Page heading / primary KPI value | 28px | 700 | 1.15 |

Weights: regular 400 and bold 700 only. Use tabular numerals for KPI values and chart data where supported. Do not use uppercase for full-length descriptions or error copy.

## Color

The 60/30/10 split is a visual allocation, not an instruction to recolor existing surfaces: keep the light canvas dominant, white panels and navy shell secondary, and blue sparse.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F4F7FB` | Main content canvas and breathing room |
| Secondary (30%) | `#FFFFFF` panels; `#0C1422` sidebar | KPI cards, tables, panels, and navigation shell |
| Accent (10%) | `#0879D1` | Refresh primary action, active navigation, linked KPI/quick-action emphasis, and booking trend line only |
| Destructive / error | `#EF4444` | Failed request/error indicator only; Phase 1 has no destructive business-data actions |

Accent reserved for: the primary Refresh overview button; active admin navigation; link/focus emphasis on KPI cards and the three header quick actions; the bookings line in the trend chart. Keep general metric counts and panel surfaces neutral. Enquiry trend uses `#6366F1` as its distinct chart-series color, not as a second primary action color. Pending and success states may use the existing amber and green tokens with explicit status text; never communicate status by color alone.

## Overview Visual Contract

1. Retain the current fixed dark-navy desktop sidebar, white top bar, light-gray content canvas, breadcrumb, authenticated account/logout controls, and responsive mobile navigation drawer. Do not alter the Auth0 route or public site.
2. The overview begins with the page heading and a compact action group aligned to it: **Motorcycles**, **Bookings**, and **Enquiries**. Keep the explicit **Refresh overview** control in this header. On narrow screens the heading and actions wrap without overlap.
3. Use a KPI-first hierarchy:
   - Primary row (four prominent, clickable neutral cards): **Total motorcycles**, **Total bookings**, **Pending bookings**, **Total enquiries**.
   - Compact secondary row (six smaller clickable cards): **Confirmed bookings**, **Completed bookings**, **Unread enquiries**, **Customer reviews**, **Published social posts**, **Service videos**.
   - This is the complete required count inventory. Do not substitute or silently omit a count, add an unrequested total-revenue KPI, or use a fabricated “total customers” count in its place.
4. General totals use neutral typography and surfaces. Pending bookings and unread enquiries receive restrained amber accents; confirmed/completed counts use the existing positive/neutral status treatment. Do not use large alert fills or decorative gradients.
5. Place the booking/enquiry trend and booking-status breakdown beneath the metric rows, using clean white panels with a heading, legible labels, and restrained axes/gridlines. Show two separate monthly line series: bookings in Yamaha blue and enquiries in indigo. The range is the trailing 12 calendar months. Prefer an inline SVG/CSS chart already supported by the project; do not add a charting dependency. Provide a textual/accessible data equivalent for screen readers.
6. Place the **Recent bookings** and **Recent enquiries** panels side by side at desktop width, each with at most five API-returned records and a “View all” link. Stack these panels on mobile. Show customer, model, and status only when the corresponding record fields exist; do not invent customer details or motorcycle names.
7. Include **Recent admin activity** below the recent-record panels, with up to six actual activity entries and an existing-section link. Empty activity is explicitly identified; no demo notification feed or fixed alert badge is presented as current activity.
8. Show a compact **System status** area on the overview that distinguishes API availability from storage mode. Render only backend-confirmed values. State MongoDB only when the response identifies MongoDB; identify the local JSON fallback as development storage, not live MongoDB. If a service status is absent, unverified, or the request fails, say **Status unavailable** rather than showing a green connected state. Never infer media-store or analytics availability from a successful page render.

## Responsive Behavior

Use the existing admin breakpoints (1024px, 860px, and 640px) and shell behavior; keep the page free of horizontal overflow.

| Viewport | Contract |
|----------|----------|
| Desktop, above 1024px | Existing 260px sidebar; four primary KPIs in one row and six secondary KPIs in a compact three-column grid; charts in two columns; recent panels side by side. Keep page content within the existing 1560px maximum. |
| Tablet, 641–1024px | Preserve the collapsible/mobile-drawer transition at 860px; use two-column KPI rows and stack chart panels when they no longer fit legibly. Recent panels remain side by side only when each has adequate content width; otherwise stack. |
| Mobile, 640px and below | Sidebar opens as the existing overlay drawer; hide the global search as the existing shell does. Use two KPI columns where the content width permits and one column on very narrow screens; keep secondary metrics visually compact. Stack charts, bookings, and enquiries. Allow header actions to wrap and preserve 44px hit areas. |

Tables and activity content must wrap, truncate with an accessible full value, or scroll inside their own panel only as a last resort; none may create page-level horizontal scrolling. The 12-month chart scales to panel width and keeps month labels readable.

## Interaction and Data Contract

| Element | Interaction |
|---------|-------------|
| Header quick actions | Use links to `/admin/motorcycles`, `/admin/bookings`, and `/admin/enquiries`. Preserve the existing authenticated admin shell and navigation behavior. |
| KPI cards | Make the entire card keyboard accessible and navigate to its related admin section. Apply a relevant filter where that section already supports it; do not imply an unsupported filter. |
| Refresh overview | Fetch the current overview on activation, disable/relabel the button while the request is in flight, then update the last-updated time only after a successful response. Do not add polling. |
| Trend chart | Render separate monthly booking and enquiry series for 12 trailing calendar months. Fill zero-count months only after a successful data query; a failed/missing series is not a zero series. Include readable month and value descriptions and a non-visual data equivalent. |
| System status | Show API availability and actual storage/backend mode as separate facts. Use backend response fields, not hardcoded labels or a green default. |
| Authentication shell | Preserve existing Auth0/session access, allowlist/fail-closed behavior, navigation, account identity, and logout flow. No overview UI may bypass authentication. |

Treat the overview as API-backed business data, never as sample content or browser-local persistence. Fetch on overview route entry and retain the explicit manual refresh. The existing `requestJson()` request path is the project pattern; request failure must not be represented as a successful response.

Metric semantics must remain backend-authoritative:
- Display total motorcycles, total bookings, total enquiries, reviews, published social posts, and service videos from confirmed API counts.
- Display pending, confirmed, and completed booking counts only from explicit API counts or an explicit backend status mapping. Do not infer `pending` from `new`, or `completed` from `converted`, unless the API contract defines that mapping.
- Display unread enquiries only from an explicit unread count/definition. Do not infer unread from `new` without an API-defined equivalence.
- A confirmed successful response may establish a count of zero. A missing, malformed, or unconfirmed field is **Not reported** (or `—` with an accessible explanation), not zero.
- Use only API-returned records for recent bookings, enquiries, and activity. Do not supply local seed/sample fallback values on production routes.

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | **Refresh overview** |
| Quick action labels | **Motorcycles** · **Bookings** · **Enquiries** |
| Loading state | **Loading live overview…** |
| Empty state heading | **No overview activity yet** |
| Empty state body | **No bookings or enquiries were returned. New activity will appear here after the API confirms it.** |
| Error state | **We couldn’t load the live overview. Check your connection and try again.** |
| Error retry action | **Retry overview** |
| Empty recent bookings | **No recent bookings yet.** |
| Empty recent enquiries | **No recent enquiries yet.** |
| Empty recent activity | **No recent admin activity yet.** |
| Unconfirmed service status | **Status unavailable** |
| Destructive confirmation | **None in Phase 1: the overview has no destructive business-data actions. Preserve the existing logout confirmation: “Log out from Vathilai Motors Admin Panel?”** |

Use plain sentence case for state messages and action labels. If an API returns a safe, useful error detail, show it without secrets or implementation internals and retain the retry action. Do not display “MongoDB connected” or “real-time” unless the actual response confirms the claim.

## UI Considerations

All applicable state considerations are resolved explicitly against the overview copy and interaction contract above. Failed or missing values are never silently presented as empty or zero.

| Category | Element(s) | Status | Verification | Resolution |
|----------|------------|--------|--------------|------------|
| empty | E1: KPI and recent-record collections | resolved | explicit | A successful empty response renders the specified empty states; only a confirmed successful count may display zero. |
| loading | E1: overview data, chart, and recent collections | resolved | explicit | Keep the shell visible, show shape-matched placeholders and “Loading live overview…”, and disable Refresh until the request settles. |
| error | E1: overview data and collections | resolved | explicit | Show the retryable overview error and preserve retry; never substitute zeros, sample data, or a connected state after failure. |
| populated | E1: KPI, chart, recent collections, and activity | resolved | explicit | Render confirmed API counts and returned records only; show up to five bookings, five enquiries, and six activity entries. |
| partial | E1: counts and record fields | resolved | explicit | Retain confirmed fields and label missing/unconfirmed counts “Not reported”; do not infer status mappings or unread counts. |
| overflow | E1: KPI, chart, tables, and activity | resolved | explicit | Wrap or accessibly truncate long values; constrain any necessary table scroll to its panel and prevent page-level overflow. |
| zero-one-many | E1: recent bookings, enquiries, and activity | resolved | explicit | Use the empty copy at zero, preserve readable spacing for one record, and cap overview lists at the specified number of returned records. |
| loading | E2: Refresh and retry controls | resolved | explicit | Disable/relabel Refresh while a request is in flight and announce completion through the live status region. |
| error | E2: Refresh/retry actions and navigation | resolved | explicit | Keep a retry action available after load failure; links continue to use existing authenticated admin routes. |
| overflow | E2: header quick actions and KPI links | resolved | explicit | Let actions wrap at narrow widths, preserve 44px touch targets, and keep keyboard focus visible. |
| long-text | E2: navigation and interactive labels | resolved | explicit | Keep labels readable with wrapping or accessible truncation; do not clip focus indicators or reduce hit areas. |
| overflow | E3: status and state copy | resolved | explicit | Wrap status and safe error copy within the content panel without creating page-level horizontal overflow. |
| long-text | E3: backend status/error descriptions | resolved | explicit | Show safe, useful details in readable wrapping text; suppress secrets and implementation internals. |

Also: all links and buttons have visible keyboard focus; use semantic links for navigation, a live status announcement for refresh completion, and an alert role for request failures. Status badges include text as well as color. Respect `prefers-reduced-motion`; keep existing restrained transitions and avoid adding chart animation that obscures data.

## Phase Acceptance Criteria

- [ ] Existing Auth0-backed admin access, fail-closed production behavior, shell/navigation/account/logout, and all public-site behavior remain unchanged.
- [ ] Overview fetches on entry and via manual refresh only; successful refresh updates the last-updated indicator, and no polling is introduced.
- [ ] All ten specified counts are visibly represented across the primary and secondary KPI rows and are sourced from confirmed backend data with explicit status semantics.
- [ ] Booking and enquiry trends are separate lines covering the trailing 12 calendar months; zero-filled months appear only after successful data retrieval.
- [ ] Recent bookings and enquiries are distinct desktop panels and stack on mobile; recent activity and the three quick actions remain available.
- [ ] API/storage mode and availability are truthful, separated, and never presented as connected when unknown or failed.
- [ ] Initial loading, successful empty data, partial/missing data, populated data, and retryable request failure are visually distinct; no production demo or mock fallback appears.
- [ ] Desktop, tablet, and mobile layouts remain usable without page-level horizontal overflow; keyboard focus and status are not conveyed by color alone.
- [ ] No new component library, unrelated abstractions, public redesign, or Phase 2+ CRUD is added.

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| Not applicable — no shadcn initialization | None | Not applicable |
| Third-party registries | None | Not applicable |

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS
- [ ] Dimension 7 Inventory Provenance: PASS — no design-system package is installed; component inventory omitted because Tool is none.

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS — no design-system package is installed; component inventory omitted because Tool is none.

**Approval:** approved — verified by `gsd-ui-checker`; UI state considerations resolved explicitly.
