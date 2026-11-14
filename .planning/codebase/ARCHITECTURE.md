---
last_mapped_commit: f6c9a5d8e0135d046e50ff8948baa688d88d5df7
last_mapped_at: 2026-11-14
---
﻿<!-- refreshed: 2026-11-14 -->
# Architecture

**Analysis Date:** 2026-11-14

## System Overview

```text
┌───────────────────────────────────────────────────────────────┐
│                   Public Website / Admin Client                 │
│   `src/App.jsx` + `src/components/Yamaha/*` + `src/components/Admin/*` │
├───────────────────────────────┬───────────────────────────────┤
│   Route orchestration         │   Admin dashboard / CRM UI     │
│   `src/App.jsx`               │   `src/components/Admin/`       │
├───────────────────────────────┴───────────────────────────────┤
│                     Browser-side state + navigation            │
│   `window.history`, React hooks, lazy-loaded route screens    │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     API / Auth / Persistence Layer             │
│   `server/index.js` + `server/adminStores.js`                 │
│   - Express app, auth checks, REST endpoints                 │
│   - file-backed JSON + optional MongoDB storage               │
├───────────────────────────────┬───────────────────────────────┤
│   Public catalog endpoints     │   Admin CRUD endpoints          │
│   `/api/public/*`             │   `/api/admin/*`               │
├───────────────────────────────┴───────────────────────────────┤
│                     Data storage / static assets               │
│   `server/data/*.json`, `public/`, optional MongoDB          │
└───────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App shell | Determines route, loads catalogue state, manages selected bike and browser navigation | `src/App.jsx` |
| Bootstrap | Starts React app, first fetches public motorcycles, mounts component tree | `src/main.jsx` |
| Public marketing pages | Hero, services, sections, product detail flows, booking journey | `src/components/Yamaha/` |
| Admin console | Dashboard, media management, social content, enquiries, settings, analytics | `src/components/Admin/` |
| API gateway | Auth, admin enforcement, public and private endpoints, validation, error handling | `server/index.js` |
| Data stores | File-based JSON persistence and MongoDB-backed persistence for admin entities | `server/adminStores.js` |
| Frontend build proxy | Vite dev server proxies `/api`, `/login`, `/logout`, `/callback` to backend | `vite.config.js` |
| Static media | Images, assets, videos and uploads used by public pages and admin media library | `public/` |

## Pattern Overview

**Overall:** Hybrid single-page application with a Node/Express backend and route-driven browser state.

**Key Characteristics:**
- The frontend is a Vite + React app with lazy-loaded route screens and shared state stored in `App.jsx`.
- The backend exposes REST APIs under `/api/public` and `/api/admin`, with auth enforcement on admin routes.
- Public catalogue data originates from the server and is hydrated into a client-side in-memory catalog (`src/components/Yamaha/yamahaMotorcycles.js`).
- Local development uses JSON files under `server/data/`; production can swap to MongoDB via `MONGODB_URI` and `initializeMongoDatabase()`.
- The app manages page transitions through `window.history.pushState`/`replaceState` instead of a router library.

## Layers

**Presentation layer:**
- Purpose: Renders the branded Yamaha experience and the admin dashboard.
- Location: `src/`, `src/components/Yamaha/`, `src/components/Admin/`
- Contains: React components, CSS, client-side hooks, data formatting utilities.
- Depends on: Fetch API, browser DOM, server endpoints, shared catalogue utilities.
- Used by: `src/App.jsx` and the browser runtime.

**Application layer:**
- Purpose: Route decisions, booking flow validation, data shaping, user actions such as navigation, selection, and persistence.
- Location: `src/App.jsx`, `src/components/Yamaha/yamahaCatalogueUtils.js`, `src/components/Yamaha/yamahaMotorcycles.js`
- Contains: Query-string resolution, catalog lookups, motorcycle-slug matching, booking flow logic.
- Depends on: Public API response data and in-memory catalog state.
- Used by: `src/components/Yamaha/*` and `src/components/Admin/*` via props and fetches.

**API service layer:**
- Purpose: Validates requests, enforces admin authorization, and coordinates CRUD for motorcycles, bookings, and site content.
- Location: `server/index.js`
- Contains: Express routes, `validateBookingInput`, `requireAdmin`, Mongo/file persistence wrappers.
- Depends on: `server/adminStores.js`, `mongodb`, `express-openid-connect`.
- Used by: UI fetch calls and browser flows for public and admin actions.

**Persistence layer:**
- Purpose: Stores admin modules and motorcycle records in either JSON files or MongoDB collections.
- Location: `server/adminStores.js`, `server/data/`, `public/`
- Contains: `createDataStore`, seed data objects, uploaded media, and generated JSON fixtures.
- Depends on: Node filesystem and optional MongoDB connection.
- Used by: `server/index.js` routes and the admin console.

## Data Flow

### Primary Request Path

1. `src/main.jsx` bootstraps the app and fetches `/api/public/motorcycles` to hydrate the client catalog.
2. `src/App.jsx` reads `window.location.pathname`, query strings, and selected bike state to choose which route to render.
3. Public screen components in `src/components/Yamaha/` render the current view and call `fetch('/api/public/...')` when needed.
4. `server/index.js` resolves the route, reads catalog or store data, validates input, and writes to file/Mongo.
5. The response is returned to the browser and the UI refreshes the route view or table data.

### Admin Data Flow

1. `src/components/Admin/YamahaAdmin.jsx` loads dashboard state through `requestJson()` from `src/components/Admin/adminApi.js`.
2. Backend checks `requireAdmin` and returns data for overview, analytics, bookings, enquiries, media, settings, and content.
3. `server/adminStores.js` converts each collection into file-backed JSON or MongoDB collection reads/writes.
4. UI updates present data in in-browser tables and forms; write operations submit back to `/api/admin/*`.

**State Management:**
- React local component state drives most UI rendering and route transitions.
- Browser `history.state` stores route metadata like `selectedBikeId`, `fromCatalog`, and `fromHome`.
- Shared runtime catalogue state is held in `src/components/Yamaha/yamahaMotorcycles.js` and refreshed from the server when available.

## Key Abstractions

**Motorcycle catalog:**
- Purpose: Represents the public and India-market model data used across marketing pages, detail views, and booking flows.
- Examples: `src/components/Yamaha/yamahaMotorcycles.js`, `src/components/Yamaha/yamahaIndiaCatalog.js`
- Pattern: Shared mutable array exported as `yamahaMotorcycles`, rewritten by `replaceYamahaMotorcycles()`.

**Dealer/business settings:**
- Purpose: Centralizes contact details, map links, WhatsApp/contact actions and default dealership values.
- Examples: `src/components/Yamaha/businessConfig.js`, `src/components/Yamaha/useBusinessSettings.js`
- Pattern: Configuration object with exported helper functions for URLs and business metadata.

**Data store abstraction:**
- Purpose: Gives each admin collection a single interface for JSON-file or MongoDB persistence.
- Examples: `server/adminStores.js`
- Pattern: `createDataStore(collectionName, seedData, isSingleton)` returns `read`, `write`, and `mutate` methods.

## Entry Points

**Frontend app:**
- Location: `src/main.jsx`
- Triggers: Browser load of the page.
- Responsibilities: Initializes React root, fetches public motorcycles, mounts `App`.

**Route shell:**
- Location: `src/App.jsx`
- Triggers: Browser navigation and route changes.
- Responsibilities: Handles public pages, details pages, booking pages, admin route delegation, and stateful navigation.

**Backend server:**
- Location: `server/index.js`
- Triggers: `npm run start`, `npm run dev:api`, or Vite middleware startup.
- Responsibilities: Express server, auth configuration, REST endpoints, storage initialization, static asset serving, runtime validation.

**Build and proxy layer:**
- Location: `vite.config.js`
- Triggers: Vite development and production builds.
- Responsibilities: Connects frontend and backend during development, copies `public/` to `dist`, and proxies `/api` traffic.

## Architectural Constraints

- **Threading:** Single Node process serving the API and static frontend; no worker-thread pool is used.
- **Global state:** `yamahaMotorcycles` in `src/components/Yamaha/yamahaMotorcycles.js` is module-level mutable state; `mongoDatabase` and `mongoClient` in `server/index.js` are process-level globals.
- **Circular imports:** No major circular import chain is evident; `server/index.js` imports the store module and the UI code imports catalog utilities without reverse dependency loops.
- **Authentication:** Admin APIs are protected by `requireAdmin`; production enforces Auth0 allowlists and fails closed without configuration.
- **Storage strategy:** Public catalog and admin stores can be file-backed locally or Mongo-backed when configured, but the same route contracts are expected in both modes.

## Anti-Patterns

### Large route orchestration in a single component

**What happens:** `src/App.jsx` owns page routing, history manipulation, fetch orchestration, state resolution, and screen selection in a single component.
**Why it's wrong:** This creates a dense state machine and makes route behaviors harder to isolate and test.
**Do this instead:** Split route logic into dedicated route components or a router-specific module while keeping `App.jsx` as a thin container.

## Error Handling

**Strategy:** Backend uses `apiError()` for structured 4xx/5xx validation errors and Express error middleware; client fetch wrappers surface error messages and UI fallbacks.

**Patterns:**
- `server/index.js` catches route-level errors and forwards them to `next(error)`.
- `src/App.jsx` handles failed catalog fetches with `catalogError` state and uses default local data.
- Validation functions check the presence, shape, and allowed values for motorcycle requests and booking data before writing to storage.

## Cross-Cutting Concerns

**Logging:** `logAdminActivity()` and admin activity stores track create/update/delete/status changes across bookings, content, and admin actions. See `server/index.js` and `server/adminStores.js`.
**Validation:** `validateBookingInput()` and `validateMotorcycleInput()` enforce business rules for public appointments and catalogue changes. See `server/index.js`.
**Authentication:** Admin routes require Auth0-based identity or a development-only bypass in `server/index.js` when `development` is true and no Auth0 configuration is supplied.

---

*Architecture analysis: 2026-11-14*
