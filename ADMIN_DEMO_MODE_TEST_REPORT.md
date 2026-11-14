# Yamaha Admin Demo Mode Test Report

## Summary

The admin UI can be opened in Vite development without an Express API, MongoDB, or Auth0. Development demo mode uses isolated fictional sample records, labels the UI `DEMO MODE – DATA NOT SAVED`, and keeps edits in development-browser storage (or temporary in-memory state when browser storage is unavailable). Demo mutations do not call the API or update public Yamaha content.

The existing API/Auth0-backed admin path remains available by setting `VITE_ADMIN_DEMO_MODE=false` in the development environment and restarting Vite. The demo provider is gated by `import.meta.env.DEV`; it is not selected by production builds.

## Implemented

- Added a demo dashboard and demo navigation for all current admin routes.
- Added sample collections and UI workflows for motorcycles, service videos, social profiles and posts, enquiries, reviews, gallery, website content, homepage content, website sections, media, profile, SEO, users, settings, and activity.
- Added shared demo collection interactions where applicable: create, view, edit, delete with confirmation, search, status filtering, sort, field validation, and image/video previews.
- Added a demo reset action. Reset removes the stored browser demo data and returns the UI to sample seed records.
- Clearly labels simulated publishing, scheduling, uploading, social integrations, permissions, analytics, and persistence. No real external platform or storage operations are performed.
- Made the API proxy target configurable using `VITE_ADMIN_API_URL`, defaulting to `http://127.0.0.1:3001`.
- Improved the API-connected unavailable state with an actionable message when the Express API is not reachable.

## Files created or modified

- `src/components/Admin/adminNavigation.js` — shared admin paths, labels, and demo collection mapping.
- `src/components/Admin/adminDemoProvider.js` — development-only demo gate, fictional seed data, temporary storage, CRUD, subscriptions, and reset.
- `src/components/Admin/YamahaAdminDemo.jsx` — development dashboard, section navigation, and demo workflows.
- `src/components/Admin/YamahaAdmin.jsx` — selects the demo UI in eligible development sessions and retains the API-backed implementation when demo mode is disabled.
- `src/components/Admin/YamahaAdmin.css` — scoped demo styling and responsive layouts.
- `vite.config.js` — configurable development proxy target for admin API routes.
- `.env.example` — documents demo mode and optional API URL settings.
- `ADMIN_DEMO_MODE_TEST_REPORT.md` — this report.

No MongoDB models, Auth0 setup, Express API endpoints, or real social-media integrations were added. No dependencies were installed.

## Verification results

| Check | Result |
|---|---|
| Vite development UI with API stopped and demo enabled | Passed; admin sections rendered without `/api/` requests. |
| Admin route coverage | Passed; all 18 current admin paths opened and displayed their expected section headings. |
| Demo CRUD | Passed for motorcycle create/edit/delete; delete confirmation was accepted and the deleted record disappeared. |
| Search, status filter, and sort | Passed on demo motorcycle records. |
| Social post editing and status workflow | Passed; the UI explicitly states that posts are not published or scheduled externally. |
| URL scheme validation | Passed; a `javascript:` post URL was rejected with a visible validation message. |
| Reset | Passed; confirmed reset removed the demo browser-storage key and restored seed data. |
| Media previews | Passed for gallery imagery, a selected local image preview, and the six service-video preview entries. Selected files are preview-only and are not uploaded. |
| Responsive overflow check | Passed at viewport widths 375, 768, 1024, and 1440 px; no document-level horizontal overflow was measured. |
| API-connected mode with API stopped | Passed; demo UI was absent and a clear `ADMIN SERVICE UNAVAILABLE` state appeared. |
| Production demo-mode gate | Passed; the production build excluded the demo banner/storage markers, and `/admin` uses the API-backed path. |
| Public route smoke check | Passed for `/`, `/services`, and `/motorcycle-details`; each rendered its expected public content. |
| Production build | Passed with Vite 6.4.5; 66 modules transformed. |
| Express server syntax | Passed with `node --check server/index.js`. |
| `git diff --check` | Passed; Git emitted only existing line-ending conversion warnings. |

The production build emitted these JavaScript chunks (raw / gzip): admin 36.48 / 9.04 kB; services 4.40 / 1.74 kB; motorcycle details 6.01 / 1.94 kB; shared entry 156.38 / 50.52 kB; home 161.86 / 59.05 kB. The first build attempt encountered a transient Windows `EBUSY` while copying a public image; after stopping the local Vite sessions, the final build completed successfully.

There is no configured automated test script or discovered test suite. Browser coverage was performed against a local Vite development server; it is not a substitute for testing authenticated API behavior or real device/browser combinations.

## Limitations and future integration requirements

- **MongoDB Atlas:** provision a database, configure connection secrets on the server only, add validated schemas/models and persistence APIs, and handle connection failures.
- **Auth0:** configure tenant/client/callback/logout settings, validate tokens or sessions server-side, and enforce administrator roles on every protected endpoint. Demo mode intentionally provides no authentication.
- **Media storage:** configure an approved object-storage provider, server-side upload validation and size/type limits, access controls, and durable media URLs. The current file chooser only creates a temporary local preview.
- **Social platforms:** obtain platform developer applications, credentials, required permissions, OAuth/token handling, rate-limit and webhook behavior, and server-side publishing/scheduling workers. Current post statuses are sample UI state only.
- **Persistent admin data:** create real APIs, database migrations/models, authorization, auditing, and error handling before moving demo workflows to production. Demo localStorage is not a production persistence mechanism.
- **Production routing and security:** verify the production deployment's API origin, CORS/session policy, CSRF protections, secrets, and role-based access before enabling API-backed administration.
- **Functional depth:** section navigation is covered across all routes, while detailed CRUD interaction checks were focused on representative motorcycle and social-post workflows. The remaining forms and actions still require manual acceptance testing as real requirements and integrations become available.
