# Requirements: Vathilai Motors Yamaha Admin Dashboard

**Defined:** 2026-11-14
**Core Value:** Authorized dealership staff can manage business records through the dashboard and trust that every successful action is validated and persisted by the backend.

## v1 Requirements

### Authentication and Dashboard

- [ ] **AUTH-01**: Staff access the dashboard using the existing authentication; admin APIs remain protected and production authorization fails closed.
- [ ] **DASH-01**: The `/admin` experience has a consistent, responsive Yamaha-branded shell, navigation, page context, and account/logout controls.
- [ ] **DASH-02**: Admin screens show backend-driven loading, empty, success, and error states; failed requests never appear as successful saves.
- [ ] **DASH-03**: Production admin screens do not use demo records, mock data, or browser-only persistence.
- [ ] **DASH-04**: Dashboard statistics, recent bookings and enquiries, shortcuts, and analytics reflect API-backed records rather than hardcoded counts.

### Motorcycles and Bookings

- [ ] **MOTO-01**: Staff can search, view, create, edit, and delete motorcycle records through existing backend APIs, with validation and delete confirmation.
- [ ] **MOTO-02**: Staff can manage motorcycle images, categories, specifications, variants, colours, prices, availability, featured state, and publication state; saved catalogue changes are backend-confirmed.
- [ ] **BOOK-01**: Staff can view, search, filter, and inspect booking records and customer and motorcycle details.
- [ ] **BOOK-02**: Staff can update booking status and notes, delete with confirmation, and export records to CSV; updates persist after reload.

### Enquiries and Dealership Content

- [ ] **ENQ-01**: Staff can view, search, filter, and inspect submitted enquiries, including customer details, selected motorcycle, and message.
- [ ] **ENQ-02**: Staff can update enquiry status and internal notes, delete with confirmation, and use only configured or verified call, WhatsApp, and email actions.
- [ ] **CONTENT-01**: Staff can create, edit, order, publish or unpublish, and delete service videos, social posts, and gallery items; uploaded media and metadata persist through backend APIs.
- [ ] **CONTENT-02**: Staff can manage social account links and customer reviews, including review moderation; only approved reviews are presented publicly.
- [ ] **CONTENT-03**: Staff can manage homepage slides and sections, dealership and footer content, navigation labels, promotional banners, and SEO settings through admin APIs; saved content is available to the public site without source edits.
- [ ] **MEDIA-01**: Staff can upload, preview, search, and filter media, and safely delete unused files; large files are not stored directly in MongoDB documents.

### Settings, Analytics, and Verification

- [ ] **SET-01**: Authorized staff can update supported admin profile and business settings through the existing backend, keeping shared dealership details consistent across admin usage.
- [ ] **ANALYTICS-01**: Analytics show real booking and enquiry trends, motorcycle popularity, and booking-status distribution with appropriate loading and empty states.
- [ ] **API-01**: Persistent admin changes use validated, authorized backend APIs and the existing MongoDB-backed stores; collections are not duplicated and existing unrelated APIs and data are preserved.
- [ ] **API-02**: Large admin lists support server-side pagination, search, and filtering where needed; API failures are surfaced safely without exposing secrets.
- [ ] **RESP-01**: Dashboard and management screens work at desktop, tablet, and mobile widths without page-level horizontal overflow.
- [ ] **TEST-01**: Verification covers admin flows and refresh persistence that can be safely tested; live-MongoDB-only checks are reported separately from local JSON fallback tests.

## v2 Requirements

None identified during v1 scoping.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Further public-site redesign | This project is scoped to the admin dashboard; existing public behavior is to be preserved. |
| Changing customer booking behavior or replacing the current authentication, API, or storage architecture | Reuse existing systems and preserve unrelated working functionality. |
| Unrelated backend routes or data changes | Keep implementation limited to the admin experience and directly required support. |
| Claiming MongoDB persistence when only local JSON mode was tested | Verification reports must distinguish storage modes and actual evidence. |

## Traceability

Roadmap phases have not yet been defined.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Pending roadmap | Pending |
| DASH-01 | Pending roadmap | Pending |
| DASH-02 | Pending roadmap | Pending |
| DASH-03 | Pending roadmap | Pending |
| DASH-04 | Pending roadmap | Pending |
| MOTO-01 | Pending roadmap | Pending |
| MOTO-02 | Pending roadmap | Pending |
| BOOK-01 | Pending roadmap | Pending |
| BOOK-02 | Pending roadmap | Pending |
| ENQ-01 | Pending roadmap | Pending |
| ENQ-02 | Pending roadmap | Pending |
| CONTENT-01 | Pending roadmap | Pending |
| CONTENT-02 | Pending roadmap | Pending |
| CONTENT-03 | Pending roadmap | Pending |
| MEDIA-01 | Pending roadmap | Pending |
| SET-01 | Pending roadmap | Pending |
| ANALYTICS-01 | Pending roadmap | Pending |
| API-01 | Pending roadmap | Pending |
| API-02 | Pending roadmap | Pending |
| RESP-01 | Pending roadmap | Pending |
| TEST-01 | Pending roadmap | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21

---
*Requirements defined: 2026-11-14*
*Last updated: 2026-11-14 after initial definition*
