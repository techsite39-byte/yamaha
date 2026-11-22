---
phase: "01"
slug: "live-overview-trust-gaps"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-11-15"
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Authorized browser to protected overview API | Existing session and allowlist authorization remain server-enforced. | Authenticated admin session and dealership records |
| Backend stores to overview projection | Missing, failed, malformed, or ambiguous source data must not be presented as confirmed business truth. | Motorcycle, booking, enquiry, content, and activity records |
| Browser to admin password-reset API | Reset requests and verification attempts are untrusted and rate-limited; account existence and reset codes remain confidential. | Email address, one-time code, replacement password |
| Admin API to SMTP transport | Reset codes are delivered only through the configured mail transport and are invalidated when delivery is unavailable or fails. | Recipient address and one-time reset code |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Tampering | Overview projection and KPI rendering | medium | mitigate | Preserve source success/failure, reject malformed arrays, and test explicit status/read-state semantics (`server/adminOverview.js`, `server/adminOverview.test.js`). | closed |
| T-01-02 | Elevation of privilege | Protected `/api/admin/overview` | high | mitigate | Preserve `requireAdmin`, Auth0 allowlist enforcement, and production fail-closed checks (`server/index.js`). Source reviewed; runtime Auth0 scenarios remain pending human verification. | closed |
| T-01-03 | Information disclosure / elevation of privilege | Admin password-reset request, delivery, and verification | critical | mitigate | Use `crypto.randomInt`, account-neutral responses, no code logging/HTTP disclosure, bounded per-IP limits, delivery-failure invalidation, strict expiry, and one-time use (`server/authService.js`, `server/index.js`, focused tests). | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

## Accepted Risks Log

No accepted risks.

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-15 | 2 | 2 | 0 | Source review (ASVS L1) |
| 2026-11-18 | 3 | 3 | 0 | Source review and isolated Node tests |

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-18

**Evidence limitation:** Auth0 login, allowlist denial, production missing-configuration behavior, and logout remain staging checks. Reset mail delivery was mocked; live SMTP and MongoDB were not tested. See `01-VERIFICATION.md` and `01-VALIDATION.md`; source-level and isolated test results do not replace those runtime checks.
