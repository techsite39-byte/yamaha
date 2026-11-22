# Password-Reset Security Remediation

## Goal

Close only the approved password-reset weaknesses in Phase 1 while preserving the already-fixed production Auth0-only policy and existing non-production native-auth behavior.

## Scope and guardrails

- Address reset-code generation, storage/expiry/use, API responses, delivery failure, and bounded request/verification rate limits in `server/authService.js` and `server/index.js`.
- Remove only the duplicate `validateAdminBootstrapConfig` import in `server/index.js` so the module parses.
- Preserve all existing dirty and untracked work. Do not edit frontend files, database schema/data, deployment configuration, or the separate SHA-256 HIGH finding. Do not install dependencies, deploy, or contact live services.
- Use isolated temporary storage and controlled mail outcomes in tests; never include reset-code values, credentials, or secrets in logs or outputs.
- Source audit:
  - GOAL — Phase 1 trust-gap scope: close only the approved reset-flow trust gap.
  - REQ — AUTH-01: retain the existing Auth0/native authorization behavior and run its regressions.
  - RESEARCH — Preserve the existing Auth0/session boundary; use built-in Node crypto and do not add dependencies or contact live services.
  - CONTEXT — D-01–D-10 concern overview/dashboard behavior and do not apply; no reset-specific locked decision or deferred idea changes this scope.

## Tasks

<tasks>
<task type="auto" tdd="true">
  <name>Harden reset-code lifecycle</name>
  <files>server/authService.js, server/authService.test.js</files>
  <behavior>
    - Generated codes use Node crypto.randomInt/randomBytes.
    - A code is rejected when current time is at or beyond its expiry boundary.
    - Successful password reset consumes the code; a second use is rejected.
    - Existing password-reset and native credential/session behavior remains functional in isolated storage.
  </behavior>
  <action>Add focused tests first, then harden reset-code generation and lifecycle in the auth service. Keep code material out of logs and public-facing return contracts; retain only the internal handoff needed for email delivery. Do not alter password hashing or unrelated administrator/auth behavior.</action>
  <verify>
    <automated>node --test server/authService.test.js</automated>
  </verify>
  <done>Lifecycle tests pass for cryptographically secure generation, expiry-boundary rejection, single use, and existing native auth behavior.</done>
</task>

<task type="auto" tdd="true">
  <name>Harden reset endpoints, delivery, and regressions</name>
  <files>server/index.js, server/resetRoutes.test.js</files>
  <behavior>
    - Known and unknown email reset requests receive the same public response.
    - Reset codes are absent from API responses and captured logs.
    - Failed or unconfigured email delivery clears the pending code and fails safely without revealing account existence.
    - Reset requests and verification attempts are bounded by documented per-IP limits with expiring, bounded limiter state.
    - Existing production Auth0 authorization and non-production native-policy tests continue to pass.
  </behavior>
  <action>Add isolated route tests for the listed behaviors and mail failure/unconfigured SMTP, using controlled delivery outcomes and temporary storage; add only a narrow test seam in the route module if needed to control delivery. Implement the endpoint behavior and reasonable fixed-window per-IP request and verification limits without adding dependencies or weakening Auth0/native policy. Remove only the duplicated `validateAdminBootstrapConfig` import that prevents `server/index.js` from parsing; preserve all other existing changes in that file.</action>
  <verify>
    <automated>node --check server/index.js</automated>
    <automated>node --test server/resetRoutes.test.js server/emailService.test.js</automated>
    <automated>node --test --test-name-pattern="production startup|production Auth0 authorization|production ignores native sessions|unauthenticated requests" server/adminAuthPolicy.test.js</automated>
  </verify>
  <done>API privacy, delivery-failure cleanup, bounded rate limits, syntax, reset lifecycle, email behavior, and Auth0/native-policy regressions are covered and pass in isolated tests.</done>
</task>
</tasks>

## Threat model

### Trust boundaries

| Boundary | Untrusted input or sensitive data |
|---|---|
| Client → reset API | Email address, submitted reset code, request volume |
| Server → mail provider | Reset code and recipient; delivery can fail or be unconfigured |

### STRIDE register

| Threat ID | Category | Component | Severity | Disposition | Mitigation |
|---|---|---|---|---|---|
| T-01-05 | Information disclosure | Reset-request API | medium | mitigate | Identical public response for known/unknown emails; test response equivalence. |
| T-01-06 | Elevation of privilege | Reset-code verification | high | mitigate | Crypto randomness, strict expiry boundary, one-time consumption, and bounded verification attempts. |
| T-01-07 | Information disclosure | Reset response/logging | high | mitigate | Never serialize or log code material; assert no leak in isolated API and log-capture tests. |
| T-01-08 | Denial of service | Reset endpoints | medium | mitigate | Fixed-window per-IP limits with expiry and bounded limiter state. |
| T-01-SC | Tampering | npm/pip/cargo installs | high | mitigate | No package install is planned; if that changes, require the package-legitimacy gate and a blocking human checkpoint for [ASSUMED]/[SUS] packages. |

## Completion

Do not mark Phase 1 complete; its existing Auth0 runtime and MongoDB verification blockers remain.
