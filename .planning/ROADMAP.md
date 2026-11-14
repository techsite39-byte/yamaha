# Roadmap: Vathilai Motors Yamaha Admin Dashboard

## Overview

Deliver the admin-only dashboard as a sequence of vertical MVP capabilities, reusing the existing React/Vite, Express, Auth0, and MongoDB-compatible store architecture. Preserve the existing Auth0 foundation, admin shell, read-only inventory, section routes, responsive styling, and honest unavailable states; complete the missing data-backed overview and CRUD/persistence paths rather than rebuilding working surfaces. Then make motorcycle/booking and enquiry/settings workflows useful, followed by dealership content/media management and cross-device analytics verification. Preserve working public-site behavior and unrelated APIs/data throughout; research was skipped as requested.

## Phases

- [ ] **Phase 1: Live Overview & Trust Gaps** - Reuse the secure admin foundation and close the remaining live-data, request-state, and production-demo gaps.
- [ ] **Phase 2: Motorcycles & Bookings** - Complete backend-confirmed motorcycle catalogue and booking workflows with validated writes and scalable lists.
- [ ] **Phase 3: Enquiries & Dealership Settings** - Let staff process enquiries and maintain shared dealership contact/settings safely.
- [ ] **Phase 4: Content & Media Management** - Enable backend-persisted management of dealership content, reviews, and media.
- [ ] **Phase 5: Analytics & Cross-Device Confidence** - Deliver real analytics and confirm safe persistence and responsive behavior across admin workflows.

## Phase Details

### Phase 1: Live Overview & Trust Gaps
**Goal**: Staff can use the existing secure admin foundation and trust its overview and production data states without replacing already-working authentication, shell, or read-only inventory.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. Existing Auth0-backed access, allowlist enforcement, production fail-closed behavior, branded shell, navigation, and account/logout controls continue to work for authorized staff.
  2. Admin requests and actions communicate loading, empty, success, and error states, and a failed request is never presented as a successful save.
  3. Production routes use the API-backed experience, never demo/mock records or browser-only persistence as real business data; any demo path remains explicitly development-only.
  4. The overview's statistics, recent bookings and enquiries, shortcuts, and analytics reflect API-backed records rather than hardcoded counts or sample activity.
**Plans**: TBD
**Vertical MVP mode**: Yes — retain the working auth/shell/read-only surfaces and complete the missing overview data path through protected APIs.
**UI hint**: yes

### Phase 2: Motorcycles & Bookings
**Goal**: Staff can manage catalogue records and bookings through complete, validated workflows whose results are confirmed by the existing backend and store.
**Depends on**: Phase 1
**Requirements**: MOTO-01, MOTO-02, BOOK-01, BOOK-02, API-01, API-02
**Success Criteria** (what must be TRUE):
  1. Staff can search, inspect, create, edit, and confirmed-delete motorcycle records; catalogue images, categories, specifications, variants, colours, prices, availability, featured state, and publication state save through the backend.
  2. Staff can search, filter, inspect booking/customer/motorcycle details, update status and notes, confirmed-delete bookings, and export records to CSV; saved changes remain after reload.
  3. Motorcycle and booking writes are authorized and validated by existing API/store paths, preserve unrelated APIs and records, and do not create duplicate collections.
  4. Large motorcycle and booking lists support server-side pagination, search, and filtering where needed, with API failures surfaced safely and without secrets.
**Plans**: TBD
**Vertical MVP mode**: Yes — each catalogue/booking workflow connects the UI, existing API, persistence, and verification.
**UI hint**: yes

### Phase 3: Enquiries & Dealership Settings
**Goal**: Staff can follow up on real customer enquiries and keep shared dealership contact information consistent.
**Depends on**: Phase 2
**Requirements**: ENQ-01, ENQ-02, SET-01
**Success Criteria** (what must be TRUE):
  1. Staff can search, filter, and inspect submitted enquiries, including customer details, selected motorcycle, and message.
  2. Staff can update enquiry status and internal notes, confirmed-delete records, and use call, WhatsApp, or email actions only when their destination is configured or verified.
  3. Authorized staff can save supported profile and business settings through the existing backend, and shared dealership details remain consistent where the admin uses them.
**Plans**: TBD
**Vertical MVP mode**: Yes — enquiry follow-up and shared settings are completed through the UI, protected APIs, persistence, and reload checks.
**UI hint**: yes

### Phase 4: Content & Media Management
**Goal**: Staff can safely maintain dealership media and editable site content through backend-backed admin workflows without source edits.
**Depends on**: Phase 3
**Requirements**: CONTENT-01, CONTENT-02, CONTENT-03, MEDIA-01
**Success Criteria** (what must be TRUE):
  1. Staff can create, edit, order, publish/unpublish, and delete service videos, social posts, and gallery items; uploaded media and metadata remain available after reload.
  2. Staff can manage social account links and moderate customer reviews, and only approved reviews are presented publicly.
  3. Staff can manage homepage slides/sections, dealership and footer content, navigation labels, promotional banners, and SEO settings through admin APIs, with saved content available to the public site without source edits.
  4. Staff can upload, preview, search, and filter media, and can safely delete unused files; large files are not stored directly in MongoDB documents.
**Plans**: TBD
**Vertical MVP mode**: Yes — content and media actions are verified end-to-end against the existing API and persistence paths.
**UI hint**: yes

### Phase 5: Analytics & Cross-Device Confidence
**Goal**: Staff can use real business analytics and rely on admin workflows across common device widths with safely verified persistence.
**Depends on**: Phase 4
**Requirements**: ANALYTICS-01, RESP-01, TEST-01
**Success Criteria** (what must be TRUE):
  1. Staff can view booking and enquiry trends, motorcycle popularity, and booking-status distribution from real records, with useful loading and empty states.
  2. The dashboard and management screens remain usable at desktop, tablet, and mobile widths without page-level horizontal overflow.
  3. Safely testable admin flows and refresh persistence are verified, and reported evidence clearly distinguishes MongoDB checks from local JSON fallback checks.
**Plans**: TBD
**Vertical MVP mode**: Yes — analytics and responsive behavior are checked in the running dashboard, with persistence evidence from the existing backend.
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Live Overview & Trust Gaps | 0/TBD | Not started | - |
| 2. Motorcycles & Bookings | 0/TBD | Not started | - |
| 3. Enquiries & Dealership Settings | 0/TBD | Not started | - |
| 4. Content & Media Management | 0/TBD | Not started | - |
| 5. Analytics & Cross-Device Confidence | 0/TBD | Not started | - |
