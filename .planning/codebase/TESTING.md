---
last_mapped_commit: f6c9a5d8e0135d046e50ff8948baa688d88d5df7
last_mapped_at: 2026-11-14
---
﻿# Testing Patterns

**Analysis Date:** 2026-11-14

## Test Framework

**Runner:**
- The repo uses Node's built-in test runner via `node:test` and `node:assert/strict` in `server/index.test.js`.
- No test framework configuration file is present; there is no `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `cypress` config file in the repo root.

**Assertion Library:**
- Assertions are native to Node (`assert.equal`, `assert.match`, `assert.ok`) as implemented in `server/index.test.js`.

**Run Commands:**
```bash
node --test server/index.test.js    # Run the project’s current API/integration tests
npm run build                       # Project verification command available in package.json
```

## Test File Organization

**Location:**
- Tests are concentrated in a single server-side file: `server/index.test.js`.
- The file is not colocated with the app code under `src/`; instead, it exercises the Express app from the server boundary.

**Naming:**
- Test files use the plain `.test.js` convention (`server/index.test.js`).
- Test names are descriptive and based on behavior rather than method names (for example, `public business settings expose the current dealership details`).

**Structure:**
```text
server/
├── index.js          # Express API and application logic
├── index.test.js     # Integration tests for bookings, catalog, and public settings
└── data/             # Local JSON fixtures and test data storage
```

## Test Structure

**Suite Organization:**
```javascript
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('public booking enquiries are validated, persisted, de-duplicated, and admin-managed', async () => {
  const server = app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${server.address().port}`;

  const response = await fetch(`${base}/api/public/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(response.status, 201);
});
```

**Patterns:**
- Each test starts its own local Express server on a random port (`app.listen(0, '127.0.0.1')`) to isolate state and avoid cross-test contamination.
- Tests call real HTTP endpoints with `fetch` against the app instance, then assert on response status, JSON payloads, and persisted data.
- Cleanup is always handled in a `finally` block, including `closeServer(server)` and `unlink` calls for any generated files in `server/data` or `public` when data files are created during a test.

## Mocking

**Framework:**
- No mocking framework is configured. There are no Jest/Vitest spies, `vi.mock`, or `sinon` imports in the repository.

**Patterns:**
```javascript
// No mock framework used; the tests exercise the live Express app and JSON persistence.
```

**What to Mock:**
- Not applicable; the test suite uses the real app and real filesystem persistence.

**What NOT to Mock:**
- The repository does not establish a mock-first testing pattern. Request validation, MongoDB fallbacks, and file writes are verified end-to-end against the implementation.

## Fixtures and Factories

**Test Data:**
- Payloads are created inline in the test file rather than imported from shared fixture modules. A representative payload is defined inside `server/index.test.js` for bookings and motorcycles.
- The tests also re-use real catalog assets such as `public/imgs/catalog/yamaha-r15-v4.webp` when validating upload and image handling.

**Location:**
- Local JSON data for the app is stored under `server/data/` and is mutated by the tests only when no existing local data file is present.
- The test suite explicitly guards against overwriting existing local catalogs or bookings by skipping when `server/data/motorcycles.json` or `server/data/bookings.json` already exists.

## Coverage

**Requirements:**
- Coverage requirements are not configured. There is no `coverage` script, no coverage threshold, and no coverage tool installed in the project manifest.

**View Coverage:**
```bash
node --test --experimental-test-coverage server/index.test.js
```

## Test Types

**Unit Tests:**
- Unit-style isolated logic is not separated into dedicated files. The project favors integration tests that exercise route handlers and validation logic end-to-end.

**Integration Tests:**
- The `server/index.test.js` suite is effectively an integration suite. It verifies public settings, booking validation, catalog CRUD, de-duping, admin status updates, and upload behavior against an actual HTTP server.
- These tests verify both business rules and persistence behavior, including the file-based fallback path and the MongoDB-capable code path.

**E2E Tests:**
- End-to-end browser tests are not detected. No Playwright, Cypress, or other browser automation layer is configured in the repo.

## Common Patterns

**Async Testing:**
```javascript
const server = app.listen(0, '127.0.0.1');
await new Promise((resolveListen) => server.once('listening', resolveListen));
const response = await fetch(`${base}/api/public/bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**Error Testing:**
```javascript
response = await fetch(`${base}/api/public/bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...payload, consent: false }),
});
assert.equal(response.status, 400);
```

**Persistence Cleanup:**
```javascript
finally {
  await closeServer(server);
  if (existsSync(bookingsPath)) await unlink(bookingsPath);
  if (uploadedImagePath && existsSync(uploadedImagePath)) await unlink(uploadedImagePath);
}
```

## CI / Automation

**Pipeline State:**
- CI workflow files are not detected under `.github/workflows/` or any other repo path.
- No GitHub Actions, Azure Pipelines, or generic CI config was found in the repository.

**Quality Gates:**
- There is no repository-defined lint gate, unit-test gate, or coverage gate in `package.json` or CI config files.
- The only readily available project check is the build script in `package.json`: `npm run build`.

---

*Testing analysis: 2026-11-14*
