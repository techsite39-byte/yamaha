---
last_mapped_commit: f6c9a5d8e0135d046e50ff8948baa688d88d5df7
last_mapped_at: 2026-11-14
---
﻿# Technology Stack

**Analysis Date:** 2026-11-14

## Languages

**Primary:**
- JavaScript (ES modules) - Frontend app in `src/App.jsx`, `src/main.jsx`, and component files under `src/components/`; server logic in `server/index.js`.
- JSX - UI composition and component rendering in `src/components/Yamaha/*.jsx` and `src/components/Admin/*.jsx`.

**Secondary:**
- JSON - Structured data and content snapshots under `server/data/*.json` and `public/models/*.glb`/archives.
- CSS - Styling in `src/styles.css` and component-scoped CSS files under `src/components/`.

## Runtime

**Environment:**
- Node.js runtime range: `^20.19.0 || ^22.12.0 || >=23.0.0` in `package.json`.
- Vite dev/build tooling runs in Node and serves the React app locally.

**Package Manager:**
- npm - `package-lock.json` present and package metadata defined in `package.json`.
- Lockfile: present

## Frameworks

**Core:**
- React 18.3.1 - App shell and UI rendering via `src/main.jsx` and `src/App.jsx`.
- Express 5.3.0 - API server and static asset hosting from `server/index.js`.
- Vite 6.0.5 - Development server, frontend build pipeline, and proxy configuration in `vite.config.js`.

**Testing:**
- Test file detected: `server/index.test.js` - verifies server API behavior with Node fetch-based assertions.
- Test runner configuration: Not detected in `package.json`; the repo contains a test file but no explicit npm test script.

**Build/Dev:**
- `@vitejs/plugin-react` 4.3.4 - React integration for Vite.
- `dotenv` 18.0.9 - Loads environment variables for the server.
- `helmet` 8.3.0 - HTTP security headers in `server/index.js`.

## Key Dependencies

**Critical:**
- `mongodb` 7.9.0 - Optional MongoDB persistence layer for admin catalog and booking storage in `server/index.js`.
- `express-openid-connect` 3.4.0 - Auth0 OIDC middleware for admin authentication in `server/index.js`.
- `gsap` 3.12.7 - Scroll-driven animation system used in `src/components/Yamaha/YamahaSection07.jsx` and related sections.
- `three` 0.171.0 - 3D engine backing the scene components under `src/components/Yamaha/`.
- `@react-three/fiber` 8.17.10 and `@react-three/drei` 9.122.0 - React wrappers for Three.js scene composition.
- `lenis` 1.1.20 - Smooth scrolling dependency referenced by the project but not directly evidenced in the active app graph.

**Infrastructure:**
- `mongodb` - Database client for persistent admin stores.
- `dotenv` - Reads server environment variables from `server/.env` and `server/data/.env`.
- `helmet` - Response hardening and CSP policy.

## Configuration

**Environment:**
- Frontend app environment variables are loaded via `loadEnv` in `vite.config.js` and `VITE_ADMIN_DEMO_MODE` is read in `src/components/Admin/adminDemoProvider.js`.
- Server env vars are loaded from `server/.env` and `server/data/.env` using `dotenv.config` in `server/index.js`.
- Runtime configuration includes `MONGODB_URI`, `MONGODB_DATABASE`, `AUTH0_*`, `ADMIN_ALLOWED_SUBJECTS`, `PORT`, and `HOST` in `server/index.js`.

**Build:**
- `vite.config.js` defines the Vite dev server, React plugin, API proxy, and production asset-copy behavior.
- `package.json` contains `dev`, `dev:api`, `start`, `build`, and `preview` scripts.

## Platform Requirements

**Development:**
- Local Node.js runtime plus npm install; start the Vite frontend with `npm run dev` and the Express API with `npm run dev:api`.
- `vite.config.js` proxies `/api`, `/login`, `/logout`, and `/callback` to the backend when the `VITE_ADMIN_API_URL` environment value is set.

**Production:**
- Build and serve static files via Vite output while the Node server in `server/index.js` handles API, Auth0/OIDC, and admin routes; `server/index.js` enforces production fail-closed checks.
- Hosting platform is not explicitly configured in the repo; deployment target is determined by the environment running `npm start` or a custom host layer.

---

*Stack analysis: 2026-11-14*
