---
last_mapped_commit: f6c9a5d8e0135d046e50ff8948baa688d88d5df7
last_mapped_at: 2026-11-14
---
﻿# Coding Conventions

**Analysis Date:** 2026-11-14

## Naming Patterns

**Files:**
- React view modules use PascalCase with descriptive page/component names such as `src/components/Yamaha/YamahaHeader.jsx`, `src/components/Yamaha/YamahaFooter.jsx`, and `src/components/Admin/YamahaAdmin.jsx`.
- Utility and data modules use camelCase or lower-case descriptive names such as `src/components/Yamaha/yamahaCatalogueUtils.js`, `src/components/Yamaha/useBusinessSettings.js`, and `src/components/Admin/adminApi.js`.
- Server-side modules use a mix of descriptive camelCase files like `server/adminStores.js` and `server/index.js`, which keeps route logic and data stores separate from the frontend component tree.

**Functions:**
- Functions are written in camelCase and usually perform a single, named responsibility, for example `createBooking`, `readMotorcycleCatalog`, and `mutateMotorcycleCatalog` in `server/index.js`.
- Inline event handlers are named as verbs with clear intent, such as `navigateToBooking`, `navigateToCatalog`, and `closeMenuAnd` in `src/App.jsx` and `src/components/Yamaha/YamahaHeader.jsx`.

**Variables:**
- Local variables and object properties use lower camelCase, while derived IDs and config keys remain explicit (`motorcycleMutationQueue`, `bookingMutationQueue`, `catalogBikeId`, `selectedBikeId`).
- React state variables are consistently named as nouns or noun phrases (`route`, `motorcycles`, `selectedBikeId`, `catalogError`).

**Types:**
- JavaScript is used throughout the codebase; there are no TypeScript files or explicit type declarations. Objects and API payloads are validated at runtime, especially in `server/index.js`.
- Constants are written in uppercase when used as fixed enumerations or status buckets, e.g. `const validStatuses = ['new', 'contacted', 'confirmed', 'cancelled', 'follow-up', 'converted'];` in `server/index.js`.

## Code Style

**Formatting:**
- Formatting is manually consistent rather than enforced by a configured formatter. Source files use semicolons, single quotes for strings, and trailing commas in multiline objects and arrays.
- The codebase favors explicit `if` blocks and early returns instead of deeply nested conditionals, as seen in `server/index.js` and `src/components/Yamaha/YamahaHeader.jsx`.
- Example conventions are visible in `vite.config.js`, `server/index.js`, and `src/App.jsx`, where object literals and function parameters are aligned into readable multiline blocks.

**Linting:**
- Linting configuration is not detected in the repo root or workflow files. No `.eslintrc*`, `eslint.config.*`, `prettier` config, or formatting script is present.
- The available project scripts in `package.json` are limited to `dev`, `dev:api`, `start`, `build`, and `preview`; there is no `lint`, `format`, or `test` script.

## Import Organization

**Order:**
1. Node built-ins and URL/path helpers (`node:fs/promises`, `node:path`, `node:url`, `node:crypto`)
2. Third-party packages (`express`, `react`, `@react-three/fiber`, `dotenv`, `helmet`)
3. Local project modules via relative imports (`./components/...`, `../src/components/...`)

**Path Aliases:**
- Path aliases are not configured. The codebase uses relative imports throughout `src/App.jsx`, `src/components/Yamaha/YamahaHeader.jsx`, `server/index.js`, and `server/adminStores.js`.
- Example: `import YamahaHeader from './components/Yamaha/YamahaHeader.jsx';` in `src/App.jsx` and `import { yamahaAllMotorcycles } from '../src/components/Yamaha/yamahaMotorcycles.js';` in `server/index.js`.

## Error Handling

**Patterns:**
- API endpoints centralize validation in a custom `apiError` helper that adds `status` and `code` to the thrown `Error`, then maps those to HTTP responses in `server/index.js`.
- Example validations include phone, email, booking consent, variant/color checks, and path sanitization in `server/index.js`.
- Frontend fetch calls in `src/App.jsx` and `src/components/Admin/adminApi.js` use `try/catch` plus explicit status checks to surface errors to the UI without crashing the app.
- The server writes user-friendly messages such as `Choose a valid booking status.` and `Enter a valid Indian mobile number.` for invalid request data.

## Logging

**Framework:**
- Logging is not centralized through a framework. The project uses `console.warn` in the Vite dev server middleware and `console` output for non-critical notices, as seen in `vite.config.js`.

**Patterns:**
- The codebase logs development warnings (`console.warn('Database note:', err.message)`) rather than structured application logging.
- Production error reporting is intentionally lightweight and relies on HTTP responses and exceptions rather than an observability pipeline.

## Comments

**When to Comment:**
- Comments are used only for non-obvious sections and data-group boundaries, not for each function block.
- `server/adminStores.js` contains section headers such as `// ==========================================` and `// SEED DATA DEFINITIONS` to organize large seed data definitions.
- `vite.config.js` includes short explanatory comments like the plugin name `yamaha-admin-backend-middleware` and the specialized file-copy logic for optimized bike frames.

**JSDoc/TSDoc:**
- No JSDoc or TSDoc blocks are used in the repository. Function signatures are self-documenting, and complex logic is explained in implementation code or route validation messages.

## Function Design

**Size:**
- The codebase prefers small focus-oriented functions rather than large classes. `server/index.js` breaks the API surface into helpers such as `readMotorcycleCatalog`, `writeMotorcycleCatalog`, `createBooking`, and `setBookingStatus`.
- Utility functions remain compact and localized, with each helper handling one concern and returning explicit values or thrown errors.

**Parameters:**
- Functions generally pass plain objects for request payloads and state updates (`createBooking(fields)`, `setBookingStatus(reference, status, notes)`, `navigateToBooking(bikeId, variant = '', color = '', configuration = {})`).
- Defaults are used for optional values, and guard checks validate required fields before mutation.

**Return Values:**
- Sync functions return plain objects or booleans; async functions return awaited data or `undefined` when a write completes without payload.
- API handlers return JSON payloads or HTTP status values, while UI callbacks return boolean-safe actions such as `return;` when a route is invalid.

## Module Design

**Exports:**
- Components typically export a single default component, as seen in `src/components/Yamaha/YamahaHeader.jsx` and `src/App.jsx`.
- Shared helpers and data stores are exported as named functions or constants (`export async function requestJson`, `export const defaultServiceVideos`, `export function setMongoDatabaseReference`).
- `server/adminStores.js` treats each data definition as a named export, which makes it easy to compose server data stores without a central barrel file.

**Barrel Files:**
- Barrel files are not used in this codebase. Imports are direct and explicit, keeping dependencies easy to trace.
- Example: `src/App.jsx` imports each lazy route component directly instead of going through a central `index` export.

---

*Convention analysis: 2026-11-14*
