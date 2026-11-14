# yamaha

## Admin portal foundation

The admin app is isolated under `/admin`; it is not linked from the public navigation. Production requires Auth0 and an exact subject-ID allowlist before it enables admin data endpoints. Development can use a localhost-only no-login session; production startup fails closed unless Auth0 is configured.

The motorcycle catalog supports server-backed create, edit, and delete operations; its existing fields remain compatible with public pages. Motorcycle catalog records and booking enquiries use MongoDB when `MONGODB_URI` is configured. Service videos and uploaded gallery images remain files under `public/`; content publishing and other modules are not provisioned.

### Local setup

Requires Node.js 20.19+, 22.12+, or 23+ (the Auth0 server SDK's supported Node ranges).

1. Create `server/data/.env` with `NODE_ENV=development`, `PORT=3001`, and `HOST=127.0.0.1`. Add `MONGODB_URI` and, optionally, `MONGODB_DATABASE` to use MongoDB locally. Keep credentials in this ignored file or a secret manager; do not commit them. Without a URI, local development uses the existing JSON-file storage.
2. In separate terminals, run `npm run dev:api` and `npm run dev`. Open `http://localhost:5173/admin`. Local development has a no-login admin session and the API binds to `127.0.0.1` by default.
3. If the MongoDB collections are empty, startup seeds motorcycles from `server/data/motorcycles.json` when it exists (otherwise from the bundled catalog) and imports `server/data/bookings.json` when present. This preserves existing local records when moving to MongoDB.
4. Before production deployment, set `NODE_ENV=production`, `MONGODB_URI`, the Auth0 issuer, client ID, client secret, a random `AUTH0_SECRET` of at least 32 characters, and the authorized Auth0 user subject ID(s) through the hosting platform's secret manager. `MONGODB_DATABASE` is optional and defaults to `yamaha`. In the Auth0 application settings, allow the production callback and `/admin` logout URLs.

The development-only no-login access must never be exposed to the public internet. Production startup fails closed without MongoDB and Auth0; admin write APIs require an allowlisted administrator. Set an HTTPS `AUTH0_BASE_URL` matching the public origin, run `npm run build`, then start the combined server with `npm start`. Catalog mutations use MongoDB transactions, while booking requests use unique indexes and atomic upserts for idempotency; configure a MongoDB replica set (including Atlas). Never commit `server/data/.env` or expose server-side credentials through `VITE_*` variables.