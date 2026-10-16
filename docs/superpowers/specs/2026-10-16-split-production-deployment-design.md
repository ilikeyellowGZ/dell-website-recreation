# Split Production Deployment Design

## Goal

Deploy the Gauvis website as a secure split application:

- DirectAdmin serves the static React frontend.
- Render runs the Express API.
- MongoDB Atlas remains the authoritative enquiry store.
- Resend sends enquiry-notification email after successful storage.

The existing enquiry administration pages remain available in the frontend and communicate with the Render API.

## Architecture

The production request path is:

```text
Browser
  ├── HTTPS → DirectAdmin → React frontend
  └── HTTPS → Render → Express API
                         ├── MongoDB Atlas
                         └── Resend
```

The frontend and API are separate HTTPS origins. The frontend receives the Render API origin at build time through `VITE_API_BASE_URL`. API clients resolve all `/api` paths against that configured origin. Local development keeps using the existing Vite `/api` proxy when the variable is absent.

The Render service runs only the API in production. It does not need to serve the frontend build, although the existing local production-preview path may remain supported for local verification.

## Enquiry Processing

MongoDB is the source of truth for accepted enquiries.

1. Apply request-size limits, rate limiting, honeypot handling, and schema validation.
2. Insert the validated enquiry into MongoDB with its existing `new` status.
3. Ask Resend to send a notification to the configured team recipient.
4. Return `201 { accepted: true }` after MongoDB storage succeeds, even if Resend is temporarily unavailable.
5. Log a sanitized email-delivery failure on Render without logging secrets or the full enquiry payload.

A Resend failure must not delete the stored enquiry, return a misleading database failure, or cause a second MongoDB insert. The admin dashboard remains the recovery path for any notification that could not be delivered.

The notification email includes the contact name, business name, email, phone, requested service, location, message, and submission time. User-controlled values are escaped before being placed in HTML. The customer email address is used as `replyTo`; it is not used as the sender. No automatic customer confirmation is included in this scope.

## Resend Configuration

The backend uses the official Resend Node SDK and reads:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_TO_EMAIL`

All three must be configured for notifications to be enabled. Missing notification configuration does not disable secure MongoDB enquiry collection; it produces a startup warning and keeps the admin dashboard as the reliable record.

Production uses a sending-only Resend API key restricted to a verified sending domain or subdomain. The sending identity should use a dedicated subdomain such as `notifications.example.com`. The key is stored only in Render environment variables and never receives a `VITE_` prefix.

## Cross-Origin Security

The Render API reads `FRONTEND_ORIGIN` as one or more comma-separated, absolute HTTPS origins. Values are parsed and normalized at startup. Production startup fails for malformed origins, wildcard values, origins containing paths, or an empty allowlist.

For allowed origins, API responses include the precise `Access-Control-Allow-Origin` value, `Access-Control-Allow-Credentials: true`, an appropriate `Vary: Origin`, and the minimum required methods and headers. Disallowed origins receive no CORS permission and state-changing requests are rejected. Wildcard CORS is never used.

The public enquiry endpoint accepts requests only from the configured frontend origin in production. Admin login and logout retain explicit origin validation. Read-only authenticated admin endpoints rely on the same strict CORS allowlist and secure session cookie.

Production admin cookies use:

- `HttpOnly`
- `Secure`
- `SameSite=None`
- `Path=/api/admin`
- the existing bounded lifetime

Frontend admin calls use `credentials: 'include'`. Local same-origin development retains compatible non-production cookie behavior.

Render runs behind a trusted reverse proxy. Production configuration uses `TRUST_PROXY=1`, preserving correct secure-cookie and rate-limit behavior. Existing Helmet headers, request limits, password verification, JWT validation, no-store admin headers, and rate limits remain in place.

## API Health and Operational Behavior

The backend exposes `GET /api/health`. It returns a small JSON response without secrets, environment details, or enquiry content. Render uses this path for service health checks. The endpoint confirms that the HTTP process is responsive; database and Resend delivery failures continue to be surfaced through sanitized logs and endpoint behavior rather than leaking infrastructure details publicly.

Shutdown continues to close the HTTP server and MongoDB connection on `SIGINT` and `SIGTERM`.

## Frontend Hosting on DirectAdmin

The DirectAdmin artifact contains only the built `dist` contents. A version-controlled Apache `.htaccess` deployment file provides:

- React Router fallback to `index.html` for non-file and non-directory requests.
- protection against directory listing.
- long-lived caching for fingerprinted `/assets` files.
- no long-lived caching for `index.html`.
- standard security headers that are safe for the static frontend.

The build is produced with:

```text
VITE_API_BASE_URL=https://<render-service-host>
VITE_ENABLE_ENQUIRIES=true
```

Only the contents of `dist` are uploaded to the domain's `public_html`. Backend source, `.env`, API keys, MongoDB credentials, JWT secrets, admin password hashes, Git metadata, tests, and source maps are not uploaded.

## Render Deployment

A root `render.yaml` defines one Node web service with:

- a reproducible install/build command;
- the production start command;
- `/api/health` as `healthCheckPath`;
- `NODE_ENV=production`;
- non-secret operational values;
- `sync: false` declarations for credentials and provider secrets;
- an automatically generated JWT secret when supported by the Blueprint.

The service binds to Render's `PORT`. Render secrets are entered through the dashboard or Blueprint creation flow and are never committed.

The deployment guide lists the complete environment matrix for Render, the DirectAdmin build, MongoDB Atlas networking, and Resend DNS verification.

## Configuration Contract

### Render runtime

- `NODE_ENV=production`
- `ENABLE_ENQUIRIES=true`
- `TRUST_PROXY=1`
- `FRONTEND_ORIGIN=https://example.com`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `MONGODB_COLLECTION`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_TO_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `JWT_SECRET_KEY`

### DirectAdmin frontend build

- `VITE_API_BASE_URL=https://<render-service-host>`
- `VITE_ENABLE_ENQUIRIES=true`

Local development may omit `VITE_API_BASE_URL` and continue using the Vite proxy.

## Failure Handling

- Invalid frontend configuration fails the frontend build with an actionable error.
- Invalid production origin configuration fails backend startup.
- Disallowed or absent production origins cannot create enquiries or establish admin sessions.
- MongoDB failure returns the existing generic service-unavailable response and sends no email.
- Resend failure after storage is logged in sanitized form and still returns an accepted response.
- Invalid enquiry input continues returning bounded field errors.
- Missing admin configuration leaves admin access unavailable without affecting public frontend delivery.
- Missing Resend configuration leaves stored enquiries accessible through the admin dashboard and produces a startup warning.

## Verification

Automated tests cover:

- API URL resolution with and without `VITE_API_BASE_URL`.
- Rejection of malformed or insecure production API/origin configuration.
- Allowed and disallowed CORS requests and preflight behavior.
- Required credentialed CORS headers without wildcard origins.
- Secure cross-origin admin cookie attributes and authenticated admin requests.
- Origin enforcement on public enquiry and admin state-changing endpoints.
- Health endpoint output and absence of sensitive data.
- Resend notification content, reply-to behavior, and HTML escaping.
- MongoDB-before-email ordering.
- Email success, missing configuration, and delivery failure after successful storage.
- No email attempt when validation or MongoDB storage fails.
- Existing rate limit, schema, admin, and enquiry behavior.
- DirectAdmin SPA fallback and cache/security configuration through static inspection.
- `render.yaml` required commands, health check, and non-committed secret declarations.

Final verification runs the full unit/integration suite, typecheck, lint, production frontend build with a representative Render URL, React Doctor, and browser tests against the split-origin configuration.

## Documentation Deliverables

`DEPLOYMENT.md` provides:

1. MongoDB Atlas setup and network-access guidance.
2. Resend sending-domain DNS verification and sending-only key creation.
3. Render Blueprint creation, secret entry, health verification, and log checks.
4. DirectAdmin frontend build and `public_html` upload steps.
5. HTTPS, SPA-route refresh, enquiry submission, email, admin login, and rollback checks.
6. Secret rotation and redeployment guidance.

## Acceptance Criteria

1. The DirectAdmin-hosted frontend sends contact and admin API requests only to the configured Render origin.
2. Render accepts credentialed browser traffic only from the configured frontend origin.
3. A valid enquiry is stored once in MongoDB before notification is attempted.
4. Resend emails the configured team recipient using a verified sender and safe reply-to address.
5. Resend failure cannot lose an enquiry or expose provider details to the browser.
6. Cross-origin admin sessions work with secure cookies and remain protected against unapproved origins.
7. Render health checks succeed without exposing secrets.
8. Direct visits and refreshes on frontend routes work on DirectAdmin.
9. Deployment files contain no secrets and the complete verification suite passes.
