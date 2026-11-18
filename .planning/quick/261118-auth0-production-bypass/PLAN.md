# Production Auth0 Bypass Remediation

## Goal

Fix only the selected production authentication finding: production admin access is Auth0-only, with exact-subject allowlisting, while native authentication remains available outside production. Remove bundled administrator credentials without mutating persisted admin data.

## Administrator access impact

Production native-password login and native sessions will be rejected. Production startup will fail if Auth0 settings or the subject allowlist are missing. Existing persisted administrators are not removed or rewritten; production administrators must have an allowlisted Auth0 identity. Empty non-production auth stores may be initialized once from operator-supplied `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` environment variables; no values are logged or committed.

## Tasks

1. Remove hard-coded default admin credentials, hashes, salts, and implicit seeding. Add a one-time, non-production environment bootstrap for an empty store; preserve existing file/Mongo records and schema.
2. Require complete Auth0 configuration and a non-empty exact subject allowlist in production. Reject native login and native session authorization/status in production; retain allowlisted Auth0 and existing non-production native behavior.
3. Add isolated tests for empty-store behavior and bootstrap, production configuration failure, allowlisted Auth0 authorization, native-session rejection, unauthorized access, and non-production native-session compatibility. Do not touch frontend, reset behavior, customer data, or deployment.

## Validation

- Run focused auth-service and auth-policy tests using temporary auth-store files only.
- Run the existing server API regression tests only if their data-safety guards confirm no user data will be modified.
- Do not run live Auth0, SMTP, MongoDB, or production verification scripts.
