# Cloudflare Workers Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the existing Vite site and its secured Express API from one Cloudflare Worker while retaining MongoDB Atlas and Resend.

**Architecture:** Keep `server/app.ts` as the single route, validation, and authentication implementation. A Worker Node HTTP adapter invokes that app for `/api/*`; a Durable Object owns the MongoDB client and small persisted security state so Atlas connections and security cooldowns do not depend on a Worker isolate. Static assets are served through the Worker `ASSETS` binding, making browser API calls same-origin.

**Tech Stack:** React 19, Vite 8, Express 5, Cloudflare Workers/Static Assets/Durable Objects, MongoDB Node driver 7, Resend, jose, Vitest, Wrangler 4.

**Spec:** User request in this conversation: “Migrate My Entire Full-Stack Project From Render to Cloudflare Workers”.

## Global Constraints

- Preserve the existing API paths, response bodies, input validation, JWT payload contract, password hash format, and React layouts.
- Do not place database, Resend, or authentication secrets in a Vite `VITE_*` variable, source control, logs, or browser bundle.
- Keep Render configuration as a rollback path; do not shut down Render without the user's later explicit approval.
- Use same-origin `/api` in the Cloudflare build; no production CORS allowlist is needed for that topology.
- Retain rate limiting, request limits, origin checks, secure cookies, and notification-failure isolation.

---

### Task 1: Make the existing application deployment-topology aware

**Files:**
- Modify: `server/adminAuth.ts`, `server/app.ts`, `server/app.test.ts`, `src/config/api.ts`, `src/config/api.test.ts`

**Interfaces:**
- Produces: `CreateAppOptions.sameOriginOnly?: boolean` and `AdminAccessConfig.sameSite?: 'None' | 'Strict'`.
- Produces: same-origin health probe request without CORS mode.

- [ ] **Step 1: Write failing topology tests**

```ts
expect(login.headers.get('set-cookie')).toContain('SameSite=Strict; Max-Age=900; Secure')
expect(fetchMock).toHaveBeenCalledWith('/api/health', { credentials: 'omit' })
```

- [ ] **Step 2: Run the focused tests and observe the old cross-origin assumptions fail**

Run: `npx vitest run server/app.test.ts src/config/api.test.ts`

- [ ] **Step 3: Add the smallest option set needed for same-origin execution**

```ts
type AdminAccessConfig = { isProduction: boolean; sameSite?: 'None' | 'Strict'; /* existing fields */ }
type CreateAppOptions = { sameOriginOnly?: boolean; /* existing fields */ }
```

Require an `Origin` matching the request host for state-changing same-origin browser requests, retain the exact `allowedOrigins` CORS behavior for the existing Render server, and set Strict/secure cookies only in Worker production mode.

- [ ] **Step 4: Run the focused tests**

Run: `npx vitest run server/app.test.ts src/config/api.test.ts`
Expected: PASS.

### Task 2: Add the Cloudflare Worker, persistent MongoDB connection, and global safeguards

**Files:**
- Create: `worker/index.ts`, `worker/config.ts`, `worker/mongo-durable-object.ts`, `worker/security-durable-object.ts`
- Modify: `server/emailTemplates.ts`, `server/enquiryNotifier.ts`, `server/app.ts`, `server/app.test.ts`

**Interfaces:**
- Produces: `export default { fetch(request, env, ctx) }` in `worker/index.ts`.
- Produces: `MongoRepositoryDurableObject` with `insert(enquiry)` and `listRecent(limit)` RPC methods.
- Produces: `SecurityDurableObject.consume(key, limit, windowMs)` and `shouldNotifyLogin(username, cooldownMs)` RPC methods.

- [ ] **Step 1: Write failing tests for Worker-specific origin/cookie behavior and notification cooldown injection**

```ts
expect(response.status).toBe(403) // foreign Origin on same-origin-only state-changing call
expect(cookie).toContain('SameSite=Strict')
```

- [ ] **Step 2: Adapt runtime-only code**

Move the inline email-logo attachment from `node:fs` to a bundled data module so Resend templates work in a Worker. Keep the existing HTML, text, logo CID, escaping, and recipients unchanged.

- [ ] **Step 3: Implement the Worker adapters**

```ts
const server = createServer(createApp(workerOptions))
const nodeHandler = httpServerHandler(server)

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname.startsWith('/api/')) return nodeHandler.fetch(request, env, ctx)
    return env.ASSETS.fetch(request)
  },
}
```

Use a named singleton Durable Object for the Mongo repository. Use a separate named Durable Object state for per-IP API limits and successful-login notification cooldowns. Return the existing 429 response contracts before forwarding a limited request to Express. Hash the client identity with a server secret before persisting the limiter key.

- [ ] **Step 4: Run application tests**

Run: `npm test`
Expected: PASS.

### Task 3: Configure, build, and document a safe Cloudflare cutover

**Files:**
- Modify: `wrangler.jsonc`, `package.json`, `package-lock.json`, `.env.example`, `.env.production`, `DEPLOYMENT.md`, `README.md`
- Restore: `render.yaml`
- Create: `.dev.vars.example`, `docs/cloudflare-migration.md`

**Interfaces:**
- Produces: `npm run deploy:cloudflare`, `npm run dev:worker`, `npm run check:worker`.
- Produces: `wrangler.jsonc` static assets, Durable Object binding/migration, `nodejs_compat`, and `/api/*` worker-first routing.

- [ ] **Step 1: Configure Wrangler for the actual project**

```jsonc
{
  "name": "dell-website-recreation",
  "main": "worker/index.ts",
  "assets": { "directory": "./dist", "binding": "ASSETS", "not_found_handling": "single-page-application", "run_worker_first": ["/api/*"] }
}
```

Use the current compatibility date and durable-object migration. Do not commit values for `MONGODB_URI`, `RESEND_API_KEY`, `JWT_SECRET_KEY`, admin credentials, or the IP hashing secret.

- [ ] **Step 2: Make builds default to same-origin**

Remove the tracked Render API URL from `.env.production`; missing `VITE_API_BASE_URL` must mean `/api`, while an explicitly configured origin remains strictly validated for legacy/local use.

- [ ] **Step 3: Run local Worker verification and static build**

Run: `npm run build`, `npm run check:worker`, `npm run dev:worker`, then request `/`, a React Router deep link, and `/api/health` at the local Worker URL.

- [ ] **Step 4: Document deployment and reversible cutover**

Document `wrangler secret put` names, GitHub deployment commands, custom-domain attachment that does not alter MX/SPF/DKIM records, MongoDB Atlas network-access validation, Resend sender verification, production smoke tests, rollback, and the explicit approval gate before Render shutdown.

## Self-review

- Current frontend API configuration, all six existing API routes, admin JWT/cookie flow, contact persistence, email notifications, and security controls are covered by Tasks 1–2.
- Static Worker deployment, secrets, custom domain, Cloudflare/GitHub settings, local verification, and Render rollback are covered by Task 3.
- Atlas and Resend live calls are deliberately not claimed as tested until the required Worker secrets and external account access are supplied.

