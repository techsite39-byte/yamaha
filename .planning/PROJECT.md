# Vathilai Motors Yamaha Admin Dashboard

## What This Is

Vathilai Motors is an existing Yamaha dealership website built with React and Vite, backed by a Node.js/Express API and MongoDB-compatible persistence. This project focuses on making its `/admin` experience a reliable, production-ready dealership management dashboard for authorized staff, while preserving the public website and existing business flows.

## Core Value

Authorized dealership staff can manage business records through the dashboard and trust that every successful action is validated and persisted by the backend.

## Business Context

- **Customer**: Vathilai Motors dealership staff use the dashboard; riders use the public Yamaha website.
- **Revenue model**: Motorcycle sales, bookings, service, and dealership enquiries.
- **Success metric**: Admin workflows return backend-confirmed results and persist correctly across reloads.

## Requirements

### Validated

- ✓ The public website has existing motorcycle catalogue, detail, booking, and service routes — existing.
- ✓ The backend exposes Express public and protected admin API routes and supports MongoDB-backed stores — existing.
- ✓ Admin access is integrated with the existing Auth0 configuration and development access behavior — existing.
- ✓ Admin modules already cover bookings, motorcycles, enquiries, content, media, reviews, social, gallery, analytics, and settings — existing.

### Active

- [ ] Rebuild the `/admin` experience as a coherent, responsive Yamaha dealership management dashboard.
- [ ] Use existing backend APIs and MongoDB collections for real admin data; complete only the missing CRUD and persistence paths.
- [ ] Remove demo mode, mock records, and browser-only persistence from the production admin experience.
- [ ] Preserve authentication, working APIs, public website behavior, and unrelated booking/catalogue functionality.
- [ ] Verify admin workflows, persistence, authorization, responsiveness, and error/loading states without claiming untested results.

### Out of Scope

- Public website redesign or changes to its customer-facing route behavior — this project is scoped to the admin experience.
- Replacing MongoDB, the existing API architecture, or the current admin authentication provider — reuse established infrastructure.
- Changing motorcycle catalog data, customer booking behavior, or unrelated backend routes — preserve existing working functionality.
- Exposing database credentials or environment secrets to the frontend — secrets remain server-side.

## Context

- Existing codebase mapping is recorded under `.planning/codebase/`.
- The application uses React 18, Vite, Express 5, and the MongoDB Node.js driver.
- `src/components/Admin/YamahaAdmin.jsx` owns authenticated admin route rendering and data loading; `YamahaAdminSections.jsx` contains management screens; `YamahaAdmin.css` styles the console.
- `server/index.js` owns API routes, authorization, request validation, and MongoDB initialization. `server/adminStores.js` provides MongoDB/JSON-backed data-store helpers.
- `server/index.test.js` contains Node test-runner API tests. Existing customer data files are present, so tests must avoid destructive fixture changes.
- Some files in the worktree already contain unrelated and in-flight public-site edits. Keep the admin redesign scoped and do not revert or incorporate those edits into this project.

## Constraints

- **Compatibility**: Preserve the existing React/Vite/Express architecture and established API contracts.
- **Security**: Keep existing authentication enforcement and fail-closed production behavior; do not broaden development access.
- **Data integrity**: Do not destroy or overwrite existing bookings, enquiries, catalogue records, or production data during testing.
- **Scope**: Limit implementation to the admin dashboard and directly required backend support; leave public presentation and unrelated flows unchanged.
- **Verification**: Report only tests and persistence checks that were actually run, and distinguish MongoDB verification from local JSON fallback.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Reuse existing APIs and MongoDB stores | Avoid duplicate models and keep current admin data contracts | — Pending |
| Preserve existing authentication and public website behavior | Explicit scope and compatibility requirement | — Pending |
| Track this project as admin dashboard work only | User selected admin-only scope; public business-details work remains separate | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? Move to Out of Scope with reason.
2. Requirements validated? Move to Validated with phase reference.
3. New requirements emerged? Add to Active.
4. Decisions to log? Add to Key Decisions.
5. Confirm that the project description still matches the codebase.

**After each milestone** (via `/gsd-complete-milestone`):
1. Review the project description, core value, constraints, and exclusions.
2. Confirm validated requirements reflect tested behavior.
3. Update context with current implementation and persistence evidence.

---
*Last updated: 2026-11-14 after initialization*
