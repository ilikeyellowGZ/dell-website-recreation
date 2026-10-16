# Split Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the React frontend for DirectAdmin, the Express API for Render, and secure MongoDB-backed enquiry notifications through Resend.

**Architecture:** A shared frontend API URL helper directs production browser requests to Render while preserving the local Vite proxy. The Render API enforces an exact origin allowlist, credentialed CORS, secure cross-site admin cookies, MongoDB-first enquiry storage, and best-effort Resend notifications. Version-controlled Render and DirectAdmin deployment files make the split reproducible without committing secrets.

**Tech Stack:** React 19, TypeScript 6, Express 5, MongoDB 7, Resend Node SDK, Vitest, Testing Library, Render Blueprint YAML, Apache `.htaccess`

**Spec:** `docs/superpowers/specs/2026-10-16-split-production-deployment-design.md`

## Global Constraints

- DirectAdmin serves only the generated static frontend; Render serves the API.
- MongoDB remains the source of truth and must store an enquiry before Resend is called.
- Resend failure after storage still returns `201 { accepted: true }` and logs no secret or full payload.
- Production CORS uses exact configured HTTPS origins, credentials, and `Vary: Origin`; never `*`.
- Production state-changing API calls reject absent or disallowed browser origins.
- Production admin cookies are `HttpOnly; Secure; SameSite=None; Path=/api/admin`.
- User-controlled email values are HTML escaped; the submitter is `replyTo`, never the sender.
- Secrets stay in Render environment variables and never use the `VITE_` prefix.
- Local development without `VITE_API_BASE_URL` keeps using the existing `/api` Vite proxy.
- Existing request limits, validation, honeypot, rate limiting, JWT checks, and generic public errors remain.

## File Structure

- Create `src/config/api.ts` and `src/config/api.test.ts`: normalize the configured API origin and build API URLs.
- Modify `src/features/contact/useQuoteForm.ts`, `src/features/admin/adminApi.ts`, and their tests: use the shared API URL and cross-origin credentials.
- Modify `server/config.ts` and `server/config.test.ts`: parse strict frontend origins and expose them in runtime configuration.
- Modify `server/adminAuth.ts` and `server/adminAuth.test.ts`: emit production cross-site scoped cookies.
- Modify `server/app.ts` and `server/app.test.ts`: exact CORS, origin enforcement, health endpoint, and notification dependency.
- Create `server/enquiryNotifier.ts` and `server/enquiryNotifier.test.ts`: Resend configuration, safe HTML rendering, and provider adapter.
- Modify `server/index.ts`: construct the notifier and inject production configuration.
- Modify `package.json` and `package-lock.json`: add the pinned Resend SDK and deployment scripts.
- Create `render.yaml`: Render Node web-service definition.
- Create `deploy/directadmin/.htaccess`: SPA fallback, cache policy, directory protection, and frontend security headers.
- Create `scripts/package-directadmin.mjs`: validated frontend build packaging.
- Modify `.env.example`: document complete backend/frontend variables without real values.
- Create `DEPLOYMENT.md`: Render, Resend, MongoDB, and DirectAdmin runbook.

---

### Task 1: Configure frontend API routing

**Files:**
- Create: `src/config/api.ts`
- Create: `src/config/api.test.ts`
- Modify: `src/features/contact/useQuoteForm.ts`
- Modify: `src/features/admin/adminApi.ts`
- Modify: `src/features/admin/adminApi.test.ts`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Produces: `apiUrl(path: `/api/${string}`): string`.
- Consumes: `import.meta.env.VITE_API_BASE_URL`.
- All contact and admin API calls consume `apiUrl`; admin calls and public enquiry submission use `credentials: 'include'`.

- [ ] **Step 1: Write failing API URL tests**

Create tests for a pure exported helper that receives an optional configured origin:

```ts
expect(resolveApiUrl('/api/enquiries', undefined)).toBe('/api/enquiries')
expect(resolveApiUrl('/api/enquiries', 'https://gauvis-api.onrender.com/'))
  .toBe('https://gauvis-api.onrender.com/api/enquiries')
for (const invalid of ['*', 'http://api.example.com', 'https://api.example.com/path', 'not-a-url']) {
  expect(() => resolveApiUrl('/api/enquiries', invalid, true)).toThrow(/VITE_API_BASE_URL/)
}
```

Export `resolveApiUrl(path, configuredOrigin, production = import.meta.env.PROD)` for deterministic tests and `apiUrl(path)` for application use.

- [ ] **Step 2: Run RED**

Run: `npm test -- src/config/api.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement strict URL resolution**

Normalize with `new URL`, require `https:` in production, reject credentials/query/hash/path other than `/`, remove the trailing slash, and concatenate the typed `/api/` path. An absent value returns the relative path.

- [ ] **Step 4: Add failing client-call assertions**

Update admin and contact tests to expect `apiUrl`-resolved endpoints and `{ credentials: 'include' }`. Preserve JSON headers and methods. In `App.test.tsx`, the enquiry submission assertion must include `credentials: 'include'`.

- [ ] **Step 5: Refactor clients through `apiUrl`**

Replace every literal frontend `/api/...` fetch target. Use `credentials: 'include'` for login, session, enquiry list, logout, and public enquiry POST.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/config/api.test.ts src/features/admin/adminApi.test.ts src/App.test.tsx && npm run typecheck && npm run lint`

Commit:

```bash
git add src/config src/features/admin/adminApi.ts src/features/admin/adminApi.test.ts src/features/contact/useQuoteForm.ts src/App.test.tsx
git commit -m "feat: route frontend requests to configured API"
```

---

### Task 2: Enforce production origins, CORS, health checks, and cookies

**Files:**
- Modify: `server/config.ts`
- Modify: `server/config.test.ts`
- Modify: `server/adminAuth.ts`
- Modify: `server/adminAuth.test.ts`
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`
- Modify: `server/index.ts`

**Interfaces:**
- Produces: `parseFrontendOrigins(value: string | undefined, isProduction: boolean): ReadonlySet<string>`.
- `RuntimeConfig` gains `frontendOrigins: ReadonlySet<string>`.
- `CreateAppOptions` gains `allowedOrigins?: ReadonlySet<string>`.
- `getSessionCookie` and `clearSessionCookie` keep their signatures but use `/api/admin`, `SameSite=None`, and `Secure` in production.

- [ ] **Step 1: Write failing configuration tests**

Test exact normalization of `https://gauvis.co.za, https://www.gauvis.co.za`, duplicate removal, development empty sets, and production rejection of missing values, `*`, HTTP, credentials, query/hash, and non-root paths.

- [ ] **Step 2: Run RED and implement `parseFrontendOrigins`**

Run: `npm test -- server/config.test.ts`

Parse at startup and throw messages naming `FRONTEND_ORIGIN` without echoing secret configuration.

- [ ] **Step 3: Write failing cookie tests**

Assert production cookies contain:

```text
Path=/api/admin; HttpOnly; SameSite=None; Max-Age=900; Secure
```

and development cookies remain usable over HTTP with `SameSite=Strict` and no `Secure`.

- [ ] **Step 4: Implement cookie modes**

Change only cookie attributes; retain name, JWT lifetime, signing, verification, and clearing behavior.

- [ ] **Step 5: Write failing CORS, origin, and health tests**

In `server/app.test.ts`, start the app with `allowedOrigins = new Set(['https://gauvis.example'])`. Verify:

- `OPTIONS /api/enquiries` from the allowed origin returns 204 with the exact origin, credentials, methods, headers, and `Vary: Origin`.
- disallowed preflight receives no allow-origin header.
- allowed enquiry POST succeeds; disallowed and missing-origin production-style posts return 403 before storage.
- allowed admin login sets the production cookie; disallowed login/logout return 403.
- authenticated admin reads return exact credentialed CORS headers.
- `GET /api/health` returns `200 { status: 'ok' }` and no environment/provider fields.

- [ ] **Step 6: Implement API-scoped CORS and origin enforcement**

Use a small internal middleware rather than a wildcard configuration. Handle `OPTIONS` only under `/api`. Set `Access-Control-Allow-Methods: GET,POST,OPTIONS`, `Access-Control-Allow-Headers: Content-Type`, `Access-Control-Allow-Credentials: true`, and append `Origin` to `Vary`. Reject state-changing production requests when the origin is absent or not allowed. Keep local tests/development compatible when `allowedOrigins` is empty.

- [ ] **Step 7: Inject runtime configuration**

Pass `runtimeConfig.frontendOrigins` from `server/index.ts` to `createApp`. Keep `TRUST_PROXY` parsing and pass-through intact.

- [ ] **Step 8: Verify and commit**

Run: `npm test -- server/config.test.ts server/adminAuth.test.ts server/app.test.ts && npm run typecheck && npm run lint`

Commit:

```bash
git add server/config.ts server/config.test.ts server/adminAuth.ts server/adminAuth.test.ts server/app.ts server/app.test.ts server/index.ts
git commit -m "feat: secure split-origin API access"
```

---

### Task 3: Store enquiries before sending safe Resend notifications

**Files:**
- Create: `server/enquiryNotifier.ts`
- Create: `server/enquiryNotifier.test.ts`
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`
- Modify: `server/index.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `EnquiryNotifier = { notify(enquiry: Enquiry): Promise<void> }`.
- Produces: `createConfiguredResendNotifier(environment?: NodeJS.ProcessEnv): EnquiryNotifier | null`.
- `CreateAppOptions` gains `enquiryNotifier?: EnquiryNotifier | null`.
- Uses official `resend` dependency pinned in the lockfile.

- [ ] **Step 1: Install the Resend SDK**

Run: `npm install resend --save-exact`

Verify `resend` appears in dependencies, not devDependencies.

- [ ] **Step 2: Write failing notifier tests**

Inject a minimal transport interface `{ send(input): Promise<{ error?: unknown }> }` so tests never call the network. Assert:

- missing any of the three Resend environment values returns `null`;
- a complete configuration uses the exact configured sender and recipient;
- `replyTo` is the normalized enquiry email;
- subject names the requested service and contact;
- `<script>`, `&`, quotes, and angle brackets are escaped in HTML;
- provider `{ error }` and thrown errors reject with a generic notification error that contains no API key or enquiry body.

- [ ] **Step 3: Run RED and implement notifier**

Run: `npm test -- server/enquiryNotifier.test.ts`

Build plain text and HTML variants. Implement an `escapeHtml` function covering `& < > " '`. Pass only safe structured fields to the template.

- [ ] **Step 4: Write failing integration ordering tests**

Add tests using event arrays:

```ts
const events: string[] = []
repository.insert = async () => { events.push('stored') }
notifier.notify = async () => { events.push('emailed') }
expect(events).toEqual(['stored', 'emailed'])
```

Also assert notifier is not called for validation, honeypot, disabled enquiries, missing repository, or insert failure. Assert notifier rejection after storage still returns 201 and stores exactly once. Spy on `console.error` and confirm logged output contains a fixed event name but not the API key, email, phone, or message.

- [ ] **Step 5: Inject and call the notifier**

After `repository.insert(enquiry)`, await `notifier.notify(enquiry)` in a nested `try/catch`; log only `Enquiry notification failed after storage.` plus a safe error category. Never retry or reinsert in the request handler.

- [ ] **Step 6: Configure startup**

Create the notifier once in `server/index.ts`, inject it, and warn at startup when configuration is incomplete. Never print environment values.

- [ ] **Step 7: Verify and commit**

Run: `npm test -- server/enquiryNotifier.test.ts server/app.test.ts && npm run typecheck && npm run lint`

Commit:

```bash
git add package.json package-lock.json server/enquiryNotifier.ts server/enquiryNotifier.test.ts server/app.ts server/app.test.ts server/index.ts
git commit -m "feat: email stored enquiries through Resend"
```

---

### Task 4: Add Render and DirectAdmin deployment artifacts

**Files:**
- Create: `render.yaml`
- Create: `deploy/directadmin/.htaccess`
- Create: `scripts/package-directadmin.mjs`
- Create: `scripts/package-directadmin.test.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run package:directadmin`.
- Produces ignored `release/directadmin/` containing frontend build output and `.htaccess` only.
- Render Blueprint starts the existing Express entry and uses `/api/health`.

- [ ] **Step 1: Write failing packaging tests**

Export testable `validateFrontendEnvironment` and `copyDirectAdminRelease` functions. Tests must reject missing/insecure/path-bearing production API URLs, copy `dist` plus the dotfile, and assert the release excludes `.env`, `server`, `src`, tests, source maps, and Git metadata.

- [ ] **Step 2: Run RED and implement packaging**

Run: `npm test -- scripts/package-directadmin.test.ts`

The script runs after a successful build, recreates only `release/directadmin`, copies `dist`, copies `deploy/directadmin/.htaccess`, scans the release for forbidden names/extensions, and prints the final directory without secrets.

- [ ] **Step 3: Add the Apache deployment file**

Use `Options -Indexes`, `mod_rewrite` file/directory exclusions with fallback to `/index.html`, immutable one-year cache headers for `/assets`, no-cache for `index.html`, and safe headers: `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`, and `Permissions-Policy` disabling unused sensitive features. Do not add HSTS because certificate readiness is an operator decision.

- [ ] **Step 4: Add `render.yaml`**

Define one Node web service named `gauvis-api` with `buildCommand: npm ci`, `startCommand: npm start`, `healthCheckPath: /api/health`, `NODE_ENV=production`, `ENABLE_ENQUIRIES=true`, `TRUST_PROXY=1`, generated `JWT_SECRET_KEY`, and `sync: false` declarations for `FRONTEND_ORIGIN`, MongoDB values, Resend values, admin username, and password hash. Do not commit secret values.

- [ ] **Step 5: Add package script and ignore release output**

Add `"package:directadmin": "npm run build && node scripts/package-directadmin.mjs"` and ignore `/release/`.

- [ ] **Step 6: Verify and commit**

Run with representative non-secret variables:

```bash
VITE_API_BASE_URL=https://gauvis-api.onrender.com VITE_ENABLE_ENQUIRIES=true npm run package:directadmin
npm test -- scripts/package-directadmin.test.ts
npm run typecheck
npm run lint
```

On PowerShell, set the two environment variables for the process before invoking npm. Inspect `release/directadmin` and confirm it contains `index.html`, `assets/`, `.htaccess`, and no source/secrets.

Commit:

```bash
git add render.yaml deploy/directadmin/.htaccess scripts/package-directadmin.mjs scripts/package-directadmin.test.ts package.json .gitignore
git commit -m "build: add Render and DirectAdmin deployment artifacts"
```

---

### Task 5: Document and verify the production handoff

**Files:**
- Modify: `.env.example`
- Create: `DEPLOYMENT.md`
- Modify: `README.md`
- Modify: `tests/site.browser.py`

**Interfaces:**
- Consumes all configuration names and deployment commands from Tasks 1–4.
- Produces the operator runbook and split-origin browser regression.

- [ ] **Step 1: Expand the environment example**

Document backend-only Render variables and frontend build variables in separate sections. Use obvious non-secret examples. State that `RESEND_API_KEY`, MongoDB credentials, admin hash, and JWT secret never belong in DirectAdmin.

- [ ] **Step 2: Write `DEPLOYMENT.md`**

Include exact ordered procedures for:

1. Creating MongoDB Atlas credentials and allowing Render connectivity.
2. Adding a dedicated Resend sending subdomain, copying its DNS records into the authoritative DNS provider, verifying it, and creating a sending-only restricted key.
3. Connecting the repository as a Render Blueprint, entering every `sync: false` variable, deploying, checking `/api/health`, and reviewing sanitized logs.
4. Building with `VITE_API_BASE_URL` and `VITE_ENABLE_ENQUIRIES=true`, running `npm run package:directadmin`, uploading the contents of `release/directadmin` to `public_html`, and enabling HTTPS.
5. Testing SPA refreshes, enquiry persistence, team email, reply-to, admin login/list/logout, rejected unapproved origins, and rollback.
6. Rotating Resend, MongoDB, admin, and JWT credentials and redeploying affected services.

- [ ] **Step 3: Add a split-origin browser case**

Extend the browser harness so a configurable API base can be supplied for a test server. Assert the frontend sends the contact POST to that separate origin with the exact allowed Origin header and that a disallowed origin is rejected. Keep existing same-origin browser checks.

- [ ] **Step 4: Update README deployment pointer**

Keep local setup concise and link production operators to `DEPLOYMENT.md`.

- [ ] **Step 5: Run the full quality gate**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run doctor
python tests/site.browser.py
```

Also run `npm run package:directadmin` with a representative HTTPS Render URL and inspect the release manifest.

- [ ] **Step 6: Commit documentation and verification**

```bash
git add .env.example DEPLOYMENT.md README.md tests/site.browser.py
git commit -m "docs: add secure production deployment runbook"
```

## Final Review Checklist

- [ ] DirectAdmin frontend uses only the configured Render API origin in production.
- [ ] Local development still works through the Vite proxy.
- [ ] Exact credentialed CORS and origin enforcement reject unapproved browsers.
- [ ] Production admin cookies work cross-origin without broadening scope beyond `/api/admin`.
- [ ] MongoDB insertion happens once and before Resend notification.
- [ ] Resend failure preserves the stored enquiry and returns accepted.
- [ ] Email content is escaped and secrets never enter HTML, responses, logs, or frontend bundles.
- [ ] Render health and Blueprint configuration contain no secret values.
- [ ] DirectAdmin release includes only production frontend artifacts and SPA configuration.
- [ ] Deployment documentation matches code and every verification command passes.
