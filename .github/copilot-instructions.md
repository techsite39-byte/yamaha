<!-- GSD:project-start source:PROJECT.md -->

## Project

**Vathilai Motors Yamaha Admin Dashboard**

Vathilai Motors is an existing Yamaha dealership website built with React and Vite, backed by a Node.js/Express API and MongoDB-compatible persistence. This project focuses on making its `/admin` experience a reliable, production-ready dealership management dashboard for authorized staff, while preserving the public website and existing business flows.

**Core Value:** Authorized dealership staff can manage business records through the dashboard and trust that every successful action is validated and persisted by the backend.

### Constraints

- **Compatibility**: Preserve the existing React/Vite/Express architecture and established API contracts.
- **Security**: Keep existing authentication enforcement and fail-closed production behavior; do not broaden development access.
- **Data integrity**: Do not destroy or overwrite existing bookings, enquiries, catalogue records, or production data during testing.
- **Scope**: Limit implementation to the admin dashboard and directly required backend support; leave public presentation and unrelated flows unchanged.
- **Verification**: Report only tests and persistence checks that were actually run, and distinguish MongoDB verification from local JSON fallback.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- JavaScript (ES modules) - Frontend app in `src/App.jsx`, `src/main.jsx`, and component files under `src/components/`; server logic in `server/index.js`.
- JSX - UI composition and component rendering in `src/components/Yamaha/*.jsx` and `src/components/Admin/*.jsx`.
- JSON - Structured data and content snapshots under `server/data/*.json` and `public/models/*.glb`/archives.
- CSS - Styling in `src/styles.css` and component-scoped CSS files under `src/components/`.

## Runtime

- Node.js runtime range: `^20.19.0 || ^22.12.0 || >=23.0.0` in `package.json`.
- Vite dev/build tooling runs in Node and serves the React app locally.
- npm - `package-lock.json` present and package metadata defined in `package.json`.
- Lockfile: present

## Frameworks

- React 18.3.1 - App shell and UI rendering via `src/main.jsx` and `src/App.jsx`.
- Express 5.3.0 - API server and static asset hosting from `server/index.js`.
- Vite 6.0.5 - Development server, frontend build pipeline, and proxy configuration in `vite.config.js`.
- Test file detected: `server/index.test.js` - verifies server API behavior with Node fetch-based assertions.
- Test runner configuration: Not detected in `package.json`; the repo contains a test file but no explicit npm test script.
- `@vitejs/plugin-react` 4.3.4 - React integration for Vite.
- `dotenv` 18.0.9 - Loads environment variables for the server.
- `helmet` 8.3.0 - HTTP security headers in `server/index.js`.

## Key Dependencies

- `mongodb` 7.9.0 - Optional MongoDB persistence layer for admin catalog and booking storage in `server/index.js`.
- `express-openid-connect` 3.4.0 - Auth0 OIDC middleware for admin authentication in `server/index.js`.
- `gsap` 3.12.7 - Scroll-driven animation system used in `src/components/Yamaha/YamahaSection07.jsx` and related sections.
- `three` 0.171.0 - 3D engine backing the scene components under `src/components/Yamaha/`.
- `@react-three/fiber` 8.17.10 and `@react-three/drei` 9.122.0 - React wrappers for Three.js scene composition.
- `lenis` 1.1.20 - Smooth scrolling dependency referenced by the project but not directly evidenced in the active app graph.
- `mongodb` - Database client for persistent admin stores.
- `dotenv` - Reads server environment variables from `server/.env` and `server/data/.env`.
- `helmet` - Response hardening and CSP policy.

## Configuration

- Frontend app environment variables are loaded via `loadEnv` in `vite.config.js` and `VITE_ADMIN_DEMO_MODE` is read in `src/components/Admin/adminDemoProvider.js`.
- Server env vars are loaded from `server/.env` and `server/data/.env` using `dotenv.config` in `server/index.js`.
- Runtime configuration includes `MONGODB_URI`, `MONGODB_DATABASE`, `AUTH0_*`, `ADMIN_ALLOWED_SUBJECTS`, `PORT`, and `HOST` in `server/index.js`.
- `vite.config.js` defines the Vite dev server, React plugin, API proxy, and production asset-copy behavior.
- `package.json` contains `dev`, `dev:api`, `start`, `build`, and `preview` scripts.

## Platform Requirements

- Local Node.js runtime plus npm install; start the Vite frontend with `npm run dev` and the Express API with `npm run dev:api`.
- `vite.config.js` proxies `/api`, `/login`, `/logout`, and `/callback` to the backend when the `VITE_ADMIN_API_URL` environment value is set.
- Build and serve static files via Vite output while the Node server in `server/index.js` handles API, Auth0/OIDC, and admin routes; `server/index.js` enforces production fail-closed checks.
- Hosting platform is not explicitly configured in the repo; deployment target is determined by the environment running `npm start` or a custom host layer.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- React view modules use PascalCase with descriptive page/component names such as `src/components/Yamaha/YamahaHeader.jsx`, `src/components/Yamaha/YamahaFooter.jsx`, and `src/components/Admin/YamahaAdmin.jsx`.
- Utility and data modules use camelCase or lower-case descriptive names such as `src/components/Yamaha/yamahaCatalogueUtils.js`, `src/components/Yamaha/useBusinessSettings.js`, and `src/components/Admin/adminApi.js`.
- Server-side modules use a mix of descriptive camelCase files like `server/adminStores.js` and `server/index.js`, which keeps route logic and data stores separate from the frontend component tree.
- Functions are written in camelCase and usually perform a single, named responsibility, for example `createBooking`, `readMotorcycleCatalog`, and `mutateMotorcycleCatalog` in `server/index.js`.
- Inline event handlers are named as verbs with clear intent, such as `navigateToBooking`, `navigateToCatalog`, and `closeMenuAnd` in `src/App.jsx` and `src/components/Yamaha/YamahaHeader.jsx`.
- Local variables and object properties use lower camelCase, while derived IDs and config keys remain explicit (`motorcycleMutationQueue`, `bookingMutationQueue`, `catalogBikeId`, `selectedBikeId`).
- React state variables are consistently named as nouns or noun phrases (`route`, `motorcycles`, `selectedBikeId`, `catalogError`).
- JavaScript is used throughout the codebase; there are no TypeScript files or explicit type declarations. Objects and API payloads are validated at runtime, especially in `server/index.js`.
- Constants are written in uppercase when used as fixed enumerations or status buckets, e.g. `const validStatuses = ['new', 'contacted', 'confirmed', 'cancelled', 'follow-up', 'converted'];` in `server/index.js`.

## Code Style

- Formatting is manually consistent rather than enforced by a configured formatter. Source files use semicolons, single quotes for strings, and trailing commas in multiline objects and arrays.
- The codebase favors explicit `if` blocks and early returns instead of deeply nested conditionals, as seen in `server/index.js` and `src/components/Yamaha/YamahaHeader.jsx`.
- Example conventions are visible in `vite.config.js`, `server/index.js`, and `src/App.jsx`, where object literals and function parameters are aligned into readable multiline blocks.
- Linting configuration is not detected in the repo root or workflow files. No `.eslintrc*`, `eslint.config.*`, `prettier` config, or formatting script is present.
- The available project scripts in `package.json` are limited to `dev`, `dev:api`, `start`, `build`, and `preview`; there is no `lint`, `format`, or `test` script.

## Import Organization

- Path aliases are not configured. The codebase uses relative imports throughout `src/App.jsx`, `src/components/Yamaha/YamahaHeader.jsx`, `server/index.js`, and `server/adminStores.js`.
- Example: `import YamahaHeader from './components/Yamaha/YamahaHeader.jsx';` in `src/App.jsx` and `import { yamahaAllMotorcycles } from '../src/components/Yamaha/yamahaMotorcycles.js';` in `server/index.js`.

## Error Handling

- API endpoints centralize validation in a custom `apiError` helper that adds `status` and `code` to the thrown `Error`, then maps those to HTTP responses in `server/index.js`.
- Example validations include phone, email, booking consent, variant/color checks, and path sanitization in `server/index.js`.
- Frontend fetch calls in `src/App.jsx` and `src/components/Admin/adminApi.js` use `try/catch` plus explicit status checks to surface errors to the UI without crashing the app.
- The server writes user-friendly messages such as `Choose a valid booking status.` and `Enter a valid Indian mobile number.` for invalid request data.

## Logging

- Logging is not centralized through a framework. The project uses `console.warn` in the Vite dev server middleware and `console` output for non-critical notices, as seen in `vite.config.js`.
- The codebase logs development warnings (`console.warn('Database note:', err.message)`) rather than structured application logging.
- Production error reporting is intentionally lightweight and relies on HTTP responses and exceptions rather than an observability pipeline.

## Comments

- Comments are used only for non-obvious sections and data-group boundaries, not for each function block.
- `server/adminStores.js` contains section headers such as `// ==========================================` and `// SEED DATA DEFINITIONS` to organize large seed data definitions.
- `vite.config.js` includes short explanatory comments like the plugin name `yamaha-admin-backend-middleware` and the specialized file-copy logic for optimized bike frames.
- No JSDoc or TSDoc blocks are used in the repository. Function signatures are self-documenting, and complex logic is explained in implementation code or route validation messages.

## Function Design

- The codebase prefers small focus-oriented functions rather than large classes. `server/index.js` breaks the API surface into helpers such as `readMotorcycleCatalog`, `writeMotorcycleCatalog`, `createBooking`, and `setBookingStatus`.
- Utility functions remain compact and localized, with each helper handling one concern and returning explicit values or thrown errors.
- Functions generally pass plain objects for request payloads and state updates (`createBooking(fields)`, `setBookingStatus(reference, status, notes)`, `navigateToBooking(bikeId, variant = '', color = '', configuration = {})`).
- Defaults are used for optional values, and guard checks validate required fields before mutation.
- Sync functions return plain objects or booleans; async functions return awaited data or `undefined` when a write completes without payload.
- API handlers return JSON payloads or HTTP status values, while UI callbacks return boolean-safe actions such as `return;` when a route is invalid.

## Module Design

- Components typically export a single default component, as seen in `src/components/Yamaha/YamahaHeader.jsx` and `src/App.jsx`.
- Shared helpers and data stores are exported as named functions or constants (`export async function requestJson`, `export const defaultServiceVideos`, `export function setMongoDatabaseReference`).
- `server/adminStores.js` treats each data definition as a named export, which makes it easy to compose server data stores without a central barrel file.
- Barrel files are not used in this codebase. Imports are direct and explicit, keeping dependencies easy to trace.
- Example: `src/App.jsx` imports each lazy route component directly instead of going through a central `index` export.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- The frontend is a Vite + React app with lazy-loaded route screens and shared state stored in `App.jsx`.
- The backend exposes REST APIs under `/api/public` and `/api/admin`, with auth enforcement on admin routes.
- Public catalogue data originates from the server and is hydrated into a client-side in-memory catalog (`src/components/Yamaha/yamahaMotorcycles.js`).
- Local development uses JSON files under `server/data/`; production can swap to MongoDB via `MONGODB_URI` and `initializeMongoDatabase()`.
- The app manages page transitions through `window.history.pushState`/`replaceState` instead of a router library.

## Layers

- Purpose: Renders the branded Yamaha experience and the admin dashboard.
- Location: `src/`, `src/components/Yamaha/`, `src/components/Admin/`
- Contains: React components, CSS, client-side hooks, data formatting utilities.
- Depends on: Fetch API, browser DOM, server endpoints, shared catalogue utilities.
- Used by: `src/App.jsx` and the browser runtime.
- Purpose: Route decisions, booking flow validation, data shaping, user actions such as navigation, selection, and persistence.
- Location: `src/App.jsx`, `src/components/Yamaha/yamahaCatalogueUtils.js`, `src/components/Yamaha/yamahaMotorcycles.js`
- Contains: Query-string resolution, catalog lookups, motorcycle-slug matching, booking flow logic.
- Depends on: Public API response data and in-memory catalog state.
- Used by: `src/components/Yamaha/*` and `src/components/Admin/*` via props and fetches.
- Purpose: Validates requests, enforces admin authorization, and coordinates CRUD for motorcycles, bookings, and site content.
- Location: `server/index.js`
- Contains: Express routes, `validateBookingInput`, `requireAdmin`, Mongo/file persistence wrappers.
- Depends on: `server/adminStores.js`, `mongodb`, `express-openid-connect`.
- Used by: UI fetch calls and browser flows for public and admin actions.
- Purpose: Stores admin modules and motorcycle records in either JSON files or MongoDB collections.
- Location: `server/adminStores.js`, `server/data/`, `public/`
- Contains: `createDataStore`, seed data objects, uploaded media, and generated JSON fixtures.
- Depends on: Node filesystem and optional MongoDB connection.
- Used by: `server/index.js` routes and the admin console.

## Data Flow

### Primary Request Path

### Admin Data Flow

- React local component state drives most UI rendering and route transitions.
- Browser `history.state` stores route metadata like `selectedBikeId`, `fromCatalog`, and `fromHome`.
- Shared runtime catalogue state is held in `src/components/Yamaha/yamahaMotorcycles.js` and refreshed from the server when available.

## Key Abstractions

- Purpose: Represents the public and India-market model data used across marketing pages, detail views, and booking flows.
- Examples: `src/components/Yamaha/yamahaMotorcycles.js`, `src/components/Yamaha/yamahaIndiaCatalog.js`
- Pattern: Shared mutable array exported as `yamahaMotorcycles`, rewritten by `replaceYamahaMotorcycles()`.
- Purpose: Centralizes contact details, map links, WhatsApp/contact actions and default dealership values.
- Examples: `src/components/Yamaha/businessConfig.js`, `src/components/Yamaha/useBusinessSettings.js`
- Pattern: Configuration object with exported helper functions for URLs and business metadata.
- Purpose: Gives each admin collection a single interface for JSON-file or MongoDB persistence.
- Examples: `server/adminStores.js`
- Pattern: `createDataStore(collectionName, seedData, isSingleton)` returns `read`, `write`, and `mutate` methods.

## Entry Points

- Location: `src/main.jsx`
- Triggers: Browser load of the page.
- Responsibilities: Initializes React root, fetches public motorcycles, mounts `App`.
- Location: `src/App.jsx`
- Triggers: Browser navigation and route changes.
- Responsibilities: Handles public pages, details pages, booking pages, admin route delegation, and stateful navigation.
- Location: `server/index.js`
- Triggers: `npm run start`, `npm run dev:api`, or Vite middleware startup.
- Responsibilities: Express server, auth configuration, REST endpoints, storage initialization, static asset serving, runtime validation.
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

## Error Handling

- `server/index.js` catches route-level errors and forwards them to `next(error)`.
- `src/App.jsx` handles failed catalog fetches with `catalogError` state and uses default local data.
- Validation functions check the presence, shape, and allowed values for motorcycle requests and booking data before writing to storage.

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.github/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
