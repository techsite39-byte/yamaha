# Phase 1 — UI Review

**Audited:** 2026-11-15  
**Baseline:** `.planning/phases/01-live-overview-trust-gaps/01-UI-SPEC.md` and the six-pillar standards  
**Scope:** Phase 1 admin overview and shell only  
**Screenshots:** Not captured; audit limited to previously observed browser evidence and source inspection  
**Interaction captures:** off

### Evidence boundaries

The supplied browser evidence says `/admin` loaded at 390px and 1440px without horizontal overflow, and dashboard shortcut/recent-panel links reached the motorcycles, bookings, enquiries, and activity routes. No new browser capture or interaction was performed for this review. Login or authenticated-session behavior, keyboard/focus behavior, computed reduced-motion behavior, and visual behavior at intermediate viewports were not tested. Interaction findings below are code-derived, not browser-verified.

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | Overview errors use generic database/retry copy instead of the approved API-specific error and retry labels; the global empty-overview copy is absent. |
| 2. Visuals | 3/4 | KPI-first hierarchy and responsive structure are present; a second six-link shortcut hub duplicates the three header actions and adds competing navigation. |
| 3. Color | 2/4 | Every KPI gets a blue top stripe and blue icon treatment, and all three header actions are filled primary buttons; this weakens the specified sparse accent use. |
| 4. Typography | 2/4 | Core KPI/panel text uses sizes and weights outside the specified four-size, two-weight system. |
| 5. Spacing | 2/4 | Layout uses several off-scale spacing values; overview actions are 40px high rather than the specified 44px touch target. |
| 6. Experience Design | 2/4 | Loading removes the overview and its refresh control; the refresh button's loading-disabled state is therefore not visible. The previously reported enquiry-source mismatch is resolved in code and covered by a source-contract test. |

**Overall: 13/24**

No finding is classified BLOCKER: none of the supplied browser evidence shows a broken tested route or page-level overflow. This does not certify untested authentication, keyboard, or intermediate-width behavior.

## Top 3 Priority Fixes

1. **RESOLVED — Correct enquiry unavailable-state selection** — `YamahaAdmin.jsx:825` now checks `sourceStatus.enquiries`, and `overviewUiContracts.test.js` asserts that mapping; the focused source-contract test passes (3/3 tests). This verifies source behavior only, not rendered visuals or authentication.
2. **Keep the overview context and retry affordance visible during requests** — users lose the page heading and refresh control while loading, and the approved error copy is not used — retain the shell/header, show the specified loading/error copy, and expose a reachable retry control with the required label.
3. **Bring overview styling back to the contract tokens** — off-contract type, saturated card/action accents, and undersized controls reduce scanability and touch usability — use the specified type scale/weights, neutral general KPIs, restrained blue accents, 4px spacing scale, and 44px minimum hit areas.

## Detailed Findings

### Pillar 1: Copywriting (2/4)

- **WARNING** — The contract specifies “We couldn’t load the live overview. Check your connection and try again.” and “Retry overview.” The shared error component instead displays “DATABASE CONNECTION ERROR,” “Could not load data from the admin API. Retry the request.”, and “RETRY CONNECTION” (`YamahaAdmin.jsx:47-54,1203`). The database-specific heading can imply a cause that the UI has not established, and the wording diverges from the approved sentence-case copy.
- **WARNING** — The contract's overview-level empty heading/body (“No overview activity yet” and its explanatory sentence) do not appear in the overview component. It renders separate recent-list empty messages (`YamahaAdmin.jsx:786-787,824-825,861-862`), but not the approved overall empty state.
- **Positive evidence:** “Loading live overview…” and “Refresh overview” are present (`YamahaAdmin.jsx:41,1221-1222`); the recent bookings, enquiries, and activity empty messages are specific and understandable.

### Pillar 2: Visuals (3/4)

- **WARNING** — The four primary and six secondary KPI cards, trends, status panel, and separate recent-data panels follow the intended KPI-first composition (`YamahaAdmin.jsx:581-595,605-705,754-862`). However, the page also renders a “Quick Operations Hub” containing six navigation cards after the three header actions (`YamahaAdmin.jsx:713-752`), duplicating key destinations and competing with the specified compact action group. Streamline or demote this second hub.
- **Positive evidence:** The supplied browser evidence confirms no horizontal overflow at 390px and 1440px and confirms the tested routes. CSS stacks dashboard panels at widths up to 1024px and keeps two-column primary KPIs there (`YamahaAdmin.css:2161-2168`); behavior at intermediate widths remains unverified.
- **needs_human_review: true** — Visual hierarchy, overall density, and brand feel cannot be fully judged from source plus two reported overflow checks; review screenshots at the contract breakpoints.

### Pillar 3: Color (2/4)

- **WARNING** — Blue is applied to every KPI card's top stripe and icon treatment (`YamahaAdmin.css:740-747,766-771`), and the three header quick actions all use the filled primary-button class (`YamahaAdmin.jsx:1223-1228`). With ten KPI cards, that creates at least 20 repeated blue accents before the three filled actions and chart. The spec calls for neutral general metrics and sparse blue emphasis; reserve accent surfaces for selected actions and the booking series.
- **WARNING** — The overview hardcodes chart/status colors in JSX (including blue, indigo, amber, green, and slate at `YamahaAdmin.jsx:644-648,674-692`) despite equivalent admin tokens existing in the CSS root (`YamahaAdmin.css:7-32`). Use the tokens for shared meanings and keep the distinct indigo enquiry series as the intentional exception.
- **needs_human_review: true** — The actual 60/30/10 rendered area split and color contrast are not established by code inspection or the supplied overflow/link evidence.

### Pillar 4: Typography (2/4)

- **WARNING** — The contract requires four UI sizes (12, 14, 20, 28px) and weights 400/700. The overview's shared styles instead define KPI labels at 11.5px/700 and KPI values at 26px/800 (`YamahaAdmin.css:758-760,776-780`), panel headings at 16px/750 (`:811-815`), and heading/body styles at 22–28px/800 and 13px (`:690-702`). Inline overview content also uses 12.5px and 13px (`YamahaAdmin.jsx:651,687,741`). Normalize the overview styles to the declared scale.
- **WARNING** — Trend month labels are 10px on desktop and 9px at narrow widths (`YamahaAdmin.css:2123-2132,2194-2197`), below the declared minimum 12px supporting-text size; month labels may be difficult to scan, especially on mobile.

### Pillar 5: Spacing (2/4)

- **WARNING** — The overview uses multiple values outside its declared 4px spacing scale: e.g. 10px/14px control gaps, 18px/20px card padding, 22px panel padding, and a fluid 20–36px page inset (`YamahaAdmin.css:663,725,798,806; YamahaAdmin.jsx:642,733-734`). Consolidate these to the UI-SPEC scale and retain fluidity only if it resolves to approved token values.
- **WARNING** — Header overview actions are explicitly limited to 40px high (`YamahaAdmin.css:2139-2141`), below the 44px touch target in the contract. The shell's compact controls also include 36px dimensions (`YamahaAdmin.css:390-396,2215-2240`). Raise relevant interactive targets to at least 44px.
- **Positive evidence:** The supplied checks report no page-level horizontal overflow at 390px and 1440px. This is not evidence for untested widths or target-size usability.

### Pillar 6: Experience Design (2/4)

- **WARNING** — While loading, the component renders `AdminLoading` and suppresses the overview branch (`YamahaAdmin.jsx:1202,1206`), so the page title and refresh action disappear. The refresh button has `disabled={loadingPage}` (`:1218`), but it exists only inside the branch hidden during loading; the visible control therefore cannot communicate its disabled/in-flight state. Keep the header and action group mounted, and announce the in-flight and completion/failure state.
- **RESOLVED (source/test verified; not visually verified)** — The previously reported enquiries empty-state condition checked `sourceStatus.bookings`. It now checks `sourceStatus.enquiries` (`YamahaAdmin.jsx:824-825`), selecting “Enquiries unavailable.” for that source failure. The UI source-contract test asserts this mapping (`overviewUiContracts.test.js`, test “recent enquiries report unavailable data from the enquiry source”); `node --test src/components/Admin/overviewUiContracts.test.js` passed all 3 tests. No visual or authentication behavior was checked as part of this follow-up.
- **WARNING** — A retry action exists, and the successful overview response updates the timestamp; the UI also has a reduced-motion spinner rule and focus-visible selectors (`YamahaAdmin.jsx:47-54,940-961; YamahaAdmin.css:1232-1236,2083-2088`). These are source findings only: no keyboard/focus or computed reduced-motion behavior was tested.
- **Human verification required:** Login, authenticated/unauthenticated states, actual focus appearance, refresh/retry state transitions, and intermediate-width behavior remain unverified. Do not treat the reported route clicks as authentication verification.

## Files Audited

- `.planning/STATE.md`
- `.planning/phases/01-live-overview-trust-gaps/01-01-PLAN.md`
- `.planning/phases/01-live-overview-trust-gaps/01-01-SUMMARY.md`
- `.planning/phases/01-live-overview-trust-gaps/01-02-PLAN.md`
- `.planning/phases/01-live-overview-trust-gaps/01-02-SUMMARY.md`
- `.planning/phases/01-live-overview-trust-gaps/01-CONTEXT.md`
- `.planning/phases/01-live-overview-trust-gaps/01-UI-SPEC.md`
- `src/components/Admin/YamahaAdmin.jsx`
- `src/components/Admin/YamahaAdmin.css`
- `src/components/Admin/adminApi.js`
- `src/components/Admin/adminIcons.jsx`
