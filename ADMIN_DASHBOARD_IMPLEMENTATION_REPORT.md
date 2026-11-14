# Yamaha Admin Dashboard Implementation Report

**Status:** Secure admin foundation and read-only inventory are implemented. The requested full CRUD CRM is **not complete** because MongoDB has not been provisioned and no media object-storage provider has been selected. No fake persistence was added.

## 1. Existing project analysis

- The site remains a React 18/Vite 6 single-page application. Its route handling is implemented in [src/App.jsx](./src/App.jsx) with the browser History API rather than a router package.
- The public application currently has three route surfaces: Home (`/`), Services (`/services`), and Motorcycle Details (`/motorcycle-details`).
- Seven motorcycle records are held in the local JavaScript array in [src/components/Yamaha/yamahaMotorcycles.js](./src/components/Yamaha/yamahaMotorcycles.js). There is no publication status, persistent admin data model, or existing database.
- The Service page reads six MP4 files directly from `public/`; there is no upload or playlist persistence layer.
- No existing server/API, auth provider integration, user/role store, or backend/database infrastructure was found before this work.
- Public styling uses custom CSS, Barlow Condensed and Manrope, GSAP/ScrollTrigger, and Three.js/React Three Fiber. The admin interface uses isolated CSS and does not change public theme styles or shared public components.

## 2. Approved architecture and scope

The approved direction was a Node/Express API with Auth0 now and MongoDB later. The selected database was specified as future work; no MongoDB connection, collections, schema, or database dependency was introduced.

Implemented now:

1. A separate, lazy-loaded React application under `/admin`, with no admin link in the public navigation.
2. Auth0 OIDC login/logout routes on the Node server.
3. API authorization based on the verified Auth0 subject and a server-only allowlist.
4. Read-only views of the existing motorcycle source records and local Service video files.
5. Explicit status for the unconnected database, media storage, and visitor analytics.

Intentionally deferred until the relevant infrastructure is provisioned:

- Persistent motorcycle CRUD, drafts/publishing, home and section management, and editable SEO.
- Persistent playlist order, replacement/upload/delete, and public publishing of new media.
- Persistent roles/permissions, activity records, and editable settings.
- Actual traffic analytics.

No MongoDB collection names or write API contracts were created prematurely.

## 3. Files changed

| File | Change |
|---|---|
| [src/App.jsx](./src/App.jsx) | Added a lazy admin route for `/admin` and `/admin/*`; the public Yamaha header is not rendered on admin routes. |
| [src/components/Admin/YamahaAdmin.jsx](./src/components/Admin/YamahaAdmin.jsx) | Added Auth0 setup/login/unauthorized states, the admin shell, overview, read-only motorcycle search, read-only Service video inventory, and explicit database-required states. |
| [src/components/Admin/YamahaAdmin.css](./src/components/Admin/YamahaAdmin.css) | Added isolated dark/Yamaha-blue, responsive admin styling and reduced-motion behavior. |
| [server/index.js](./server/index.js) | Added Express API/static server, optional development-only unconfigured mode, production fail-closed checks, Auth0 middleware, admin-subject authorization, read-only endpoints, and security headers. |
| [vite.config.js](./vite.config.js) | Proxies API and Auth0 paths to the local Node server during Vite development. |
| [package.json](./package.json) and [package-lock.json](./package-lock.json) | Added Express, Auth0 Express OIDC, dotenv, and Helmet; added API/start scripts and the Auth0 SDK-supported Node runtime range. |
| [.env.example](./.env.example) | Added a placeholder-only server configuration template; it contains no credentials. |
| [.gitignore](./.gitignore) | Excludes `.env` and `.env.*` while allowing the safe `.env.example` template. |
| [README.md](./README.md) | Added local Auth0 setup and production startup notes. |

No existing public page layout, navbar, shared public component, video, or public stylesheet was intentionally changed for this admin work.

## 4. Authentication and authorization

- The server uses Auth0’s Express OpenID Connect middleware. Login uses the authorization-code flow.
- The server session is held in the SDK’s encrypted cookie, configured `HttpOnly`, `SameSite=Lax`, with `Secure` enabled in production. Idle duration is one hour and absolute duration is eight hours.
- The custom login return path accepts only `/admin` or an `/admin/*` same-origin path. Logout returns to `/admin`.
- Sensitive admin data endpoints require an authenticated OIDC session and an exact subject match in `ADMIN_ALLOWED_SUBJECTS`. An authenticated but non-allowlisted identity receives `403`; an unauthenticated identity receives `401`.
- No CORS policy is enabled. Admin API responses use `Cache-Control: no-store`; Helmet supplies CSP and other headers, and HSTS is enabled only in production.
- Production server startup fails if Auth0 settings or the production build are missing. In development without Auth0, the admin route explains setup is required, and admin data endpoints return `503`.
- The Auth0 client secret and session secret are read only by the Node server. They are not exposed through frontend `VITE_*` variables.
- Password reset is left to the Auth0 Universal Login experience; tenant configuration and reset behavior were not verified.

The server-side allowlist is a single admin access boundary, not the requested Super Admin/Admin/Editor/Viewer role system. Fine-grained RBAC and persistent role management remain database-backed work.

## 5. Current API and data behavior

| Endpoint | Current behavior |
|---|---|
| `GET /api/admin/session` | Returns the authentication state without exposing user details to unauthenticated callers; returns `503` if Auth0 is not configured. |
| `GET /api/admin/overview` | Requires an authorized admin; reports source motorcycle/page/video counts and explicitly marks analytics, database, and object storage as not connected. |
| `GET /api/admin/motorcycles` | Requires an authorized admin; reads the seven existing source records and marks them non-editable. |
| `GET /api/admin/service-videos` | Requires an authorized admin; reads filenames, order, and file sizes from the six existing local MP4 files. |

No write endpoints exist. The video preview is read-only and uses the existing public files. The UI does not claim that edit, upload, publish, reorder, activity, or role operations work.

The current motorcycle source records have no active/inactive field, publication state, or date-updated field. The dashboard does not invent or infer those values.

## 6. Required configuration and infrastructure

Create a local `.env` from `.env.example`, or preferably use your deployment provider’s secret manager. Do **not** send secrets in chat or commit `.env`.

Set:

- `AUTH0_BASE_URL`: the exact app origin (`http://localhost:5173` locally; HTTPS origin in production).
- `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET`: values for an Auth0 Regular Web Application.
- `AUTH0_SECRET`: a randomly generated server-only secret of at least 32 characters.
- `ADMIN_ALLOWED_SUBJECTS`: comma-separated exact Auth0 `sub` values approved for admin access.
- `PORT` and `HOST` as needed by the host.

Allow the matching `/callback` URL and `/admin` logout URL in Auth0. Development requires two terminals: `npm run dev:api` and `npm run dev`. Production requires the Node server (`npm start`) to serve the built `dist/` files and API on the same origin; a static-only hosting plan is insufficient. The Auth0 tenant and callback were not configured or exercised during this task.

Before persistent CRUD can be completed, provision MongoDB (the user indicated MongoDB would be added later), select an object-storage provider for uploaded media, and provide those connections through server-side secrets. The public website should only be switched to database-backed published content after migration, compatibility, and fallback behavior are agreed and tested.

## 7. Verification

- `npm run build`: **passed** with Vite 6.4.5; 62 modules transformed. The admin JS/CSS are emitted as lazy route chunks.
- `node --check server/index.js`: **passed**.
- `git diff --check`: **passed** (Git printed only existing CRLF/LF normalization notices).
- `npm audit --omit=dev`: **0 vulnerabilities** reported.
- Production fail-closed check without Auth0 configuration: server exited with the expected explicit configuration error.
- With temporary, non-production test Auth0 settings, the unauthenticated session endpoint returned `authenticated:false`; protected overview, motorcycle, and video endpoints returned `401`. No test credentials were saved.
- Production route/static smoke checks returned `200` for `/`, `/admin`, `/admin/motorcycles`, `/services`, `/motorcycle-details`, both ends of the video set, and an optimized WebP asset. Protected overview returned `401`.
- Browser checks showed `/admin` has no public header; the Home and Services pages expose no `/admin` navigation links. Home, Services, and Details routes rendered.
- The admin dashboard, read-only lists, searches, database-required screens, and responsive layouts were exercised against a temporary local fixture API (not a real authenticated session). No horizontal overflow was measured at 375, 768, 1024, or 1440 CSS pixels; video previews use `preload="none"`.
- The current repository has no configured automated test or lint script. A real Auth0 login/callback, successful admin session, production deployment, MongoDB persistence, upload, and logout cycle could not be verified without your Auth0 tenant and future storage infrastructure.

## 8. Next steps to complete the CRM

1. Configure Auth0 locally and add the approved admin subject ID to the server environment.
2. Provision MongoDB and an object-storage provider; do not put their credentials in the frontend.
3. Approve the persistent data and migration design before moving the current hard-coded motorcycle/content records.
4. Implement validated, audited write endpoints and persistent RBAC; add CSRF protection for state-changing requests before enabling mutations.
5. Add secure media upload constraints, storage references, and a persisted Service playlist; then connect only approved public content surfaces.
6. Run authenticated end-to-end tests, persistence-after-refresh tests, upload/order tests, and deployment/TLS verification.
