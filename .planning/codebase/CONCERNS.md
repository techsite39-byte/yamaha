---
last_mapped_commit: f6c9a5d8e0135d046e50ff8948baa688d88d5df7
last_mapped_at: 2026-11-14
---
﻿# Codebase Concerns

**Analysis Date:** 2026-11-14

## Tech Debt

**Demo-first admin workflow is intentionally built into a production-adjacent server, but the live data path remains non-production and browser-local:**
- Issue: The admin UI can run in Vite development without a real Express API, MongoDB, or Auth0; demo mutations are persisted in browser storage and described as not being production-safe. The gate is controlled in `src/components/Admin/YamahaAdmin.jsx` and `src/components/Admin/adminDemoProvider.js`, while the Vite proxy and dev-middleware configuration live in `vite.config.js` and `server/index.js`.
- Files: `src/components/Admin/YamahaAdmin.jsx`, `src/components/Admin/adminDemoProvider.js`, `vite.config.js`, `server/index.js`, `ADMIN_DEMO_MODE_TEST_REPORT.md`
- Impact: Production deployment can accidentally inherit a dev-only admin behavior, while code paths remain split between "real" and "demo" auth/data flows without a single secure production model.
- Fix approach: Remove the demo persistence path from all production code paths, enforce a single authenticated/admin data flow under `server/index.js`, and treat localStorage or in-memory demo state as a dev-only fallback that cannot reach shipping builds.

**Large static public asset tree is treated as a build artifact rather than a managed media pipeline:**
- Issue: The project stores hundreds of large media files in `public/` and copies them wholesale to `dist/` via `vite.config.js`; the audit reports ~451 MB of copyable public content and a large amount of unreferenced data. The asset inventory is heavy and not curated by an approved media strategy.
- Files: `vite.config.js`, `public/`, `WEBSITE_TECHNICAL_AUDIT.md`, `PERFORMANCE_OPTIMIZATION_REPORT.md`
- Impact: Builds are asset-heavy, deployment size grows rapidly, and browser/mobile performance is sensitive to large, stale, or untrimmed public assets.
- Fix approach: Inventory every file in `public/`, remove unreferenced or duplicate assets, and add a deliberate versioned media pipeline with compression and CDN-friendly naming.

## Known Bugs

**Service page navigation still targets missing sections and stale anchors:**
- Symptoms: The header and menu in `src/components/Yamaha/YamahaHeader.jsx` expose actions like CONTACT and service-section anchors even when the active service page is reduced to a video hero. The audit notes missing anchors such as `#service-expertise`, `#service-process`, `#workshop`, and `#booking`.
- Files: `src/components/Yamaha/YamahaHeader.jsx`, `src/App.jsx`, `src/components/Yamaha/YamahaServices.jsx`, `WEBSITE_TECHNICAL_AUDIT.md`
- Trigger: A user clicks the menu items or service links while on `/services`; the browser scrolls to non-existent sections or falls through to the page state rather than a real target.
- Workaround: Keep the user on the current route and render valid in-page anchors or replace the nav with a route-based action that does not assume those IDs exist.

**The app has a recoverable but fragile public-catalog dependency during startup:**
- Symptoms: `src/main.jsx` fetches `/api/public/motorcycles` and falls back to the bundled catalogue when the server is unavailable, while `src/App.jsx` independently fetches the same endpoint and sets UI state only if it succeeds. This creates dual data sources and inconsistent fallback timing.
- Files: `src/main.jsx`, `src/App.jsx`, `server/index.js`
- Trigger: Server boot issues, missing MongoDB config, or a transient failure during startup cause the UI to temporarily render a stale bundled catalogue with no clear status to the user.
- Workaround: Centralize the catalogue fetch, surface a first-load status, and fail hard or degrade gracefully with a single consistent source of truth.

**Demo-only data mutation explicitly warns that it is not a security or audit record:**
- Symptoms: `src/components/Admin/adminDemoProvider.js` stores session data in browser localStorage and labels the activity as a plain demo. The test report also warns that demo localStorage is not a production persistence mechanism.
- Files: `src/components/Admin/adminDemoProvider.js`, `ADMIN_DEMO_MODE_TEST_REPORT.md`
- Trigger: A user mutates admin data in development without the real server; the app silently stores data client-side and misleads anyone into thinking it represents real authoring behavior.
- Workaround: Disable persistence by default outside dev and ensure any demo feature clearly blocks shipping output.

## Security Considerations

**Authentication and authorization are not enforced in the default admin path:**
- Risk: The server code accepts development mode access without Auth0 and warns that the admin API may be exposed publicly if not configured. `server/index.js` explicitly sets `developmentAccess: true` when `authConfigured` is false in development, and logs a warning that the admin API should not be exposed to the public internet.
- Files: `server/index.js`, `vite.config.js`, `ADMIN_DEMO_MODE_TEST_REPORT.md`
- Current mitigation: `server/index.js` enforces Auth0 configuration in production and validates `AUTH0_*` env keys plus `ADMIN_ALLOWED_SUBJECTS`; Helmet is also enabled for security headers.
- Recommendations: Keep production admin access behind Auth0 only, block any dev/local bypass from reaching production, and fail startup if required keys are absent instead of relying on warnings.

**Environment and secret handling are not hardened enough for a real app deployment:**
- Risk: The repo contains a root `.env.local` file and the Express server reads environment variables from `server/.env` and `server/data/.env`. No secret values were read or included in this report, but the project relies on config-driven secrets for MongoDB and Auth0. The audit explicitly calls out the lack of an ignore rule for `.env*` files and the need to verify deployment headers and origin policy.
- Files: `server/index.js`, `vite.config.js`, `WEBSITE_TECHNICAL_AUDIT.md`, `.env.local` (present; not read)
- Current mitigation: `server/index.js` checks if required Auth0 settings are present, loads env vars with `dotenv`, and uses `helmet` for several security headers.
- Recommendations: Add explicit `.env*` ignore rules, store secrets only in deployment-managed secret stores, and never rely on client-side storage for identity or authorization decisions.

**API and CSP boundaries are narrowly scoped but still rely on local assumptions:**
- Risk: `server/index.js` sets a liberal `styleSrc` exception (`'unsafe-inline'`) and a default `connectSrc` of `'self'` with no clear external API policy. The current code has no evidence of a broader CORS or external service hardening review, so a production deployment would need explicit origin validation.
- Files: `server/index.js`, `WEBSITE_TECHNICAL_AUDIT.md`
- Current mitigation: `helmet()` is enabled with a restrictive default policy and `x-powered-by` is disabled.
- Recommendations: Validate CSP and CORS against the real host, add explicit allow-lists for APIs and asset domains, and avoid inline client behaviour that depends on broad trust assumptions.

## Performance Bottlenecks

**The public asset tree is unusually large for a brochure-style site and not actively managed:**
- Problem: The static audit identifies ~1,444 MB total in `public/`, with ~451 MB copyable public content excluding ZIP archives. The performance audit confirms the build remains asset-heavy and the site uses a large number of frame sequences and 3D/model assets.
- Files: `public/`, `vite.config.js`, `WEBSITE_TECHNICAL_AUDIT.md`, `PERFORMANCE_OPTIMIZATION_REPORT.md`
- Cause: Large image frame sequences, model archives, and several full-resolution assets are copied to the final build without a route-by-route asset policy.
- Improvement path: Prune dead assets, keep only required frame ranges, use responsive variants, and defer non-critical 3D or media content behind user interaction.

**Home and scroll-driven animation sequences still impose substantial runtime cost on low-end devices:**
- Problem: The app loads long frame sequences and canvas-driven animation logic across `src/components/Yamaha/YamahaHeroSequence.jsx`, `src/components/Yamaha/YamahaScrollFrames.jsx`, and `src/animations/yamahaScroll.js`. Even with bounded cache and concurrency, they are still decode-heavy and network-heavy on mobile.
- Files: `src/animations/yamahaScroll.js`, `src/components/Yamaha/YamahaHeroSequence.jsx`, `src/components/Yamaha/YamahaScrollFrames.jsx`, `WEBSITE_TECHNICAL_AUDIT.md`
- Cause: Multi-frame hero sequences and scroll-triggered playback create repeated image decoding and shader/canvas work; there is no measured mobile budget or fallback strategy beyond reduced-motion checks.
- Improvement path: Reduce frame counts, use adaptive quality based on device memory/network, and gate complex animation sequences behind viewport or user interaction.

**Video payload is non-trivial and no adaptive delivery path is configured:**
- Problem: The six service videos total approximately 25 MB, and the site plays them inline as part of a crossfading hero. The performance report documents no adaptive stream or CDN setup.
- Files: `public/s1.mp4`, `public/s2.mp4`, `public/s3.mp4`, `public/s4.mp4`, `public/s5.mp4`, `public/s6.mp4`, `PERFORMANCE_OPTIMIZATION_REPORT.md`
- Cause: The project keeps full-size MP4s on the public tree and preloads the next clip near the end of the current playback sequence.
- Improvement path: Add mobile-specific variants, CDN cache rules, lazy or metadata-first loading, and explicit bandwidth checks before preloading.

## Fragile Areas

**The client-side route system is dependent on browser history, path matching, and state consistency:**
- Files: `src/App.jsx`, `src/components/Yamaha/YamahaHeader.jsx`, `src/components/Yamaha/YamahaBikeCatalog.jsx`, `src/components/Yamaha/YamahaBookingPage.jsx`
- Why fragile: Several routes push state manually, parse query params, and adjust the selected bike from `window.history.state`. When the route or `bike` parameter is absent or mismatched, UI state may drift or fall back unexpectedly.
- Safe modification: Centralize route transitions and selected-bike logic in one helper, and validate the route/state combination before rendering or pushing to history.
- Test coverage: There is no automated test suite to cover popstate, missing `bike`, or browser-history edge cases.

**Admin and demo features span UI state, browser persistence, and server configuration without a single boundary:**
- Files: `src/components/Admin/YamahaAdmin.jsx`, `src/components/Admin/adminDemoProvider.js`, `server/index.js`, `vite.config.js`
- Why fragile: The admin mode toggles based on development environment, while real path and demo path both render similar components. A small config change can accidentally expose or lock out the admin flow.
- Safe modification: Gate all admin data writes behind a single service boundary and make dev/demo mode impossible to trigger in production builds.
- Test coverage: The project does not include a test harness covering admin-mode transitions, auth failures, or production safety checks.

**Public content and service configuration are coupled to static asset filenames and route IDs:**
- Files: `src/components/Yamaha/YamahaServices.jsx`, `src/components/Yamaha/YamahaServicesVideo.css`, `src/App.jsx`, `src/components/Yamaha/YamahaHeader.jsx`
- Why fragile: The app relies on route IDs, hashes, and asset names remaining stable. The audit highlights missing anchors and stale service links, which makes a refactor or asset rename break navigation silently.
- Safe modification: Replace brittle hash links with explicit route-driven navigation and avoid coupling service flow to hard-coded DOM IDs.
- Test coverage: There is no smoke script or browser-level regression test for these routes.

## Scaling Limits

**Current app architecture is single-site and client-rendered, which scales poorly once real business data or concurrent admin workflows are introduced:**
- Current capacity: The app is a static-site frontend with local asset delivery and a small data model; there is no database-backed traffic or growth model in place.
- Limit: Once admin, booking, catalogue, or media content become multi-user and data-driven, the current architecture starts to hit limits around server concurrency, file management, image delivery, and authorization.
- Scaling path: Move to a managed database, real media storage, rate-limited APIs, and a proper deployment platform with CDN and origin isolation.

**The server and admin layer are still designed around developer convenience rather than production throughput:**
- Current capacity: `server/index.js` uses local JSON/data persistence and optional MongoDB. It can support a small workload, but it has custom mutation queues, file writes, and optional transactions without larger operational safeguards.
- Limit: High write concurrency, data deduplication, and multi-process deployment would create reliability issues without a stronger persistence and monitoring model.
- Scaling path: Add managed persistence, structured logging, health checks, rate limits, and deploy-time configuration validation.

## Dependencies at Risk

**MongoDB and Auth0 integrations are optional and incompletely enforced:**
- Risk: The project imports `mongodb` and `express-openid-connect` in `server/index.js`, but the runtime warns when they are not configured and can still start in development without real admin security. This makes the dependency chain fragile and environment-dependent.
- Files: `server/index.js`, `package.json`
- Impact: A production deployment can accidentally run with missing credentials or stale configuration, which yields partial access and undefined operational behavior.
- Migration plan: Require configuration validation at startup, enforce production environment gating, and move all secrets to managed secret stores with a fail-fast boot path.

**Large image and media dependencies are not isolated from decisions about actual use:**
- Risk: Heavy public-image and video assets are baked into the build, while the project does not track a real media optimization plan or whitelist of used files. The optimization audits show a large artifact footprint and multiple candidate cleanup items.
- Files: `public/`, `vite.config.js`, `PERFORMANCE_OPTIMIZATION_REPORT.md`
- Impact: Asset churn, stale media, and oversized bundles increase deployment time and create runtime slowness without corresponding end-user benefit.
- Migration plan: Create a single source-of-truth asset inventory and route-specific manifest so only used media ships in production.

## Missing Critical Features

**No automated test or quality gate is configured for the application:**
- Problem: `package.json` exposes only `dev`, `build`, and `preview`; there is no test, lint, coverage, or type-check script. The audit explicitly notes there is no configured automated test suite.
- Files: `package.json`, `server/index.test.js`, `WEBSITE_TECHNICAL_AUDIT.md`, `ADMIN_DEMO_MODE_TEST_REPORT.md`
- Blocks: CI safety, regression detection, and real production validation for admin, route, and media flows.

**No production deployment or hosting configuration exists in-repo:**
- Problem: There is no deployment manifest, server host config, domain config, or hosting pipeline in the repository. The audit identifies this as a manual verification need rather than an implemented platform.
- Files: `vite.config.js`, `README.md`, root project files
- Blocks: Production rollout, environment parity, and operational safety.

**No real admin data model or persistence strategy is in place beyond development-only samples:**
- Problem: The admin features are demo-only and use browser localStorage or in-memory state; the test report explicitly says this is not a production persistence mechanism.
- Files: `src/components/Admin/adminDemoProvider.js`, `server/adminStores.js`, `server/index.js`
- Blocks: Any real multi-user admin operations, audits, or content publishing workflows.

## Test Coverage Gaps

**There is no automated test coverage for route logic, browser history behavior, and admin mode transitions:**
- What's not tested: route navigation, missing `bike` parameters, popstate behavior, admin demo-vs-real mode switching, and security gating in `server/index.js`.
- Files: `src/App.jsx`, `src/components/Yamaha/YamahaHeader.jsx`, `src/components/Admin/YamahaAdmin.jsx`, `server/index.js`
- Risk: Broken navigation, stale state, or accidental admin exposure can get shipped without a failing test signal.
- Priority: High

**There is no automated coverage for static asset or media-performance regressions:**
- What's not tested: total asset size, public media inventory, optimal route chunking, and service-video fallback behavior under constrained bandwidth.
- Files: `vite.config.js`, `public/`, `PERFORMANCE_OPTIMIZATION_REPORT.md`
- Risk: Asset-heavy builds and video regressions can go unnoticed until users report slow, broken, or unusable pages.
- Priority: High

**There is no real integration coverage for API, Auth0, or MongoDB startup conditions:**
- What's not tested: startup failure, missing Auth0 secrets, missing MongoDB URIs, invalid config, and dev-only local access behavior.
- Files: `server/index.js`, `server/adminStores.js`, `package.json`
- Risk: Production hosts may boot with partial configuration or silently degrade to a less secure or less reliable state.
- Priority: High

---

*Concerns audit: 2026-11-14*
