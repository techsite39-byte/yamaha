---
last_mapped_commit: f6c9a5d8e0135d046e50ff8948baa688d88d5df7
last_mapped_at: 2026-11-14
---
﻿# External Integrations

**Analysis Date:** 2026-11-14

## APIs & External Services

**Authentication / identity:**
- Auth0 via `express-openid-connect` in `server/index.js`
  - SDK/Client: `express-openid-connect` from `package.json`
  - Auth: `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `ADMIN_ALLOWED_SUBJECTS`

**Database services:**
- MongoDB via `mongodb` in `server/index.js`
  - Client: `MongoClient`
  - Connection: `MONGODB_URI`, `MONGODB_DATABASE`
  - Storage layer: `initializeMongoDatabase()` and collection-backed reads/writes for catalog and bookings in `server/index.js`

**Public content APIs:**
- Local Express API surface in `server/index.js`
  - Endpoints such as `/api/public/motorcycles`, `/api/public/bookings`, `/api/public/settings`, and admin-only routes are implemented in the server.
  - Frontend fetches call these API URLs from `src/App.jsx` and `src/main.jsx`.

## Data Storage

**Databases:**
- MongoDB (optional, configured when `MONGODB_URI` is supplied) - `server/index.js`
  - The server falls back to local JSON files in `server/data/` when MongoDB is unavailable.

**File Storage:**
- Local filesystem only for static assets in `public/` and persisted data in `server/data/*.json`.
- Example local data stores: `server/data/motorcycles.json`, `server/data/bookings.json`, `server/data/siteSettings.json`, `server/data/mediaLibrary.json`.

**Caching:**
- Browser fetches to `/api/public/*` are configured with `cache: 'no-store'` or `cache: 'force-cache'` in front-end calls; no dedicated external cache service is configured.

## Authentication & Identity

**Auth Provider:**
- Auth0 / custom OIDC integration via `server/index.js`
  - Implementation: `app.use(auth({ ... }))` with allowed subject check using `ADMIN_ALLOWED_SUBJECTS` and session validation.
  - Frontend demo mode is independent and uses `VITE_ADMIN_DEMO_MODE` in `src/components/Admin/adminDemoProvider.js`.

## Monitoring & Observability

**Error Tracking:**
- Not detected; no third-party APM or Sentry-style integration is configured in the repo.

**Logs:**
- Server logs via `console.info`, `console.warn`, and `console.error` in `server/index.js`.
- Frontend warnings via `console.warn` in `src/main.jsx` when the server catalogue is unavailable.

## CI/CD & Deployment

**Hosting:**
- No explicit deployment platform or CI workflow was detected in the repository root beyond Vite build scripts in `package.json`.
- Build output is produced in `dist/` via the Vite static build pipeline in `vite.config.js`.

**CI Pipeline:**
- Not detected; no GitHub Actions or deployment config was found in the project root.

## Environment Configuration

**Required env vars:**
- Server-side: `MONGODB_URI`, `MONGODB_DATABASE`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `ADMIN_ALLOWED_SUBJECTS`, `PORT`, `HOST`, `NODE_ENV`.
- Frontend build/runtime: `VITE_ADMIN_API_URL`, `VITE_ADMIN_DEMO_MODE`.

**Secrets location:**
- Environment files are present at `server/.env` and `server/data/.env`; values are not included in this document.
- Vite environment variables are loaded from the local environment via `loadEnv` in `vite.config.js`.

## Webhooks & Callbacks

**Incoming:**
- Auth0 OIDC callback and login/logout flows are proxied through `/callback`, `/login`, and `/logout` in `vite.config.js` and handled by `server/index.js`.

**Outgoing:**
- No webhook endpoints or external callback registrations were identified beyond the Auth0 callback flow and server-to-client API fetches from the React app.

---

*Integration audit: 2026-11-14*
