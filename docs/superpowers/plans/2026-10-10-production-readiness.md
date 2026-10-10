# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a faster image-rich Gauvis Technology frontend with a production-safe MongoDB enquiry flow and a secure JWT-protected admin dashboard.

**Architecture:** React routes become lazy modules that own their CSS and image mappings, leaving a small dependency-free shell. Express owns environment parsing, enquiry availability, trusted-proxy policy, JWT-cookie authentication, and bounded MongoDB reads. Supplied source PNGs remain untouched while generated responsive WebP derivatives are served from `public/generated/`.

**Tech Stack:** React 19, React Router 7, Vite 8, TypeScript 6, Express 5, MongoDB 7, Vitest, Node crypto, `jose`, GSAP, Motion.

**Spec:** `docs/superpowers/specs/2026-10-10-production-readiness-design.md`

## Global Constraints

- Do not commit a MongoDB URI, JWT secret, plaintext password, password hash, or generated credential.
- Production enquiry submission remains disabled unless both browser and server deployment variables explicitly enable it.
- Express does not trust forwarded client addresses unless `TRUST_PROXY` is explicitly valid.
- Preserve source files in `public/GauvisTech_individual_images/` and generate derivatives instead of overwriting them.
- Keep GSAP and Motion limited to the lazy Home route.
- Preserve WCAG behavior, reduced-motion support, focus restoration, phone, and WhatsApp fallbacks.
- Preserve existing unrelated worktree changes and do not stage them in implementation commits.

---

### Task 1: Production configuration and proxy policy

**Files:**
- Create: `server/config.ts`
- Create: `server/config.test.ts`
- Modify: `server/app.ts`
- Modify: `server/index.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `getRuntimeConfig(environment): RuntimeConfig`, `parseTrustProxy(value): false | number | string`, and `CreateAppOptions.enquiriesEnabled`.
- Consumes: Node `ProcessEnv` and Express `app.set('trust proxy', value)`.

- [ ] **Step 1: Write failing configuration tests**

```ts
expect(parseTrustProxy(undefined)).toBe(false)
expect(parseTrustProxy('1')).toBe(1)
expect(() => parseTrustProxy('true')).toThrow('TRUST_PROXY')
expect(getRuntimeConfig({ NODE_ENV: 'production' }).enquiriesEnabled).toBe(false)
```

- [ ] **Step 2: Run the targeted test and verify expected failures**

Run: `npm test -- server/config.test.ts`
Expected: FAIL because `server/config.ts` does not exist.

- [ ] **Step 3: Implement strict environment parsing and apply it in Express**

```ts
export type RuntimeConfig = {
  enquiriesEnabled: boolean
  isProduction: boolean
  trustProxy: false | number | string
}

export function parseTrustProxy(value?: string): false | number | string
export function getRuntimeConfig(environment?: NodeJS.ProcessEnv): RuntimeConfig
```

Set Express trust proxy before rate-limit middleware and reject public enquiry POSTs with `503 ENQUIRIES_DISABLED` when disabled.

- [ ] **Step 4: Run targeted and server tests**

Run: `npm test -- server/config.test.ts server/app.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit only task files**

```bash
git add server/config.ts server/config.test.ts server/app.ts server/index.ts .env.example
git commit -m "feat: add production runtime configuration"
```

### Task 2: JWT authentication primitives

**Files:**
- Create: `server/adminAuth.ts`
- Create: `server/adminAuth.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `hashPassword(password)`, `verifyPassword(password, encodedHash)`, `createAdminToken(subject, secret)`, `verifyAdminToken(token, secret)`, `getSessionCookie(token, isProduction)`, and `clearSessionCookie(isProduction)`.
- Consumes: Node `crypto` scrypt/random bytes and `jose` SignJWT/jwtVerify.

- [ ] **Step 1: Write failing authentication tests**

```ts
const hash = await hashPassword('correct horse battery staple')
expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
expect(await verifyPassword('wrong', hash)).toBe(false)
const token = await createAdminToken('admin', secret)
expect((await verifyAdminToken(token, secret)).sub).toBe('admin')
expect(getSessionCookie(token, true)).toContain('HttpOnly')
expect(getSessionCookie(token, true)).toContain('Secure')
```

- [ ] **Step 2: Run the targeted test and verify expected failures**

Run: `npm test -- server/adminAuth.test.ts`
Expected: FAIL because authentication functions do not exist.

- [ ] **Step 3: Install `jose` and implement minimal primitives**

Run: `npm install jose`

Use scrypt with a random 16-byte salt, constant-time comparison, HS256, a 15-minute expiry, issuer `gauvis-tech`, audience `gauvis-admin`, and cookie name `gauvis_admin_session`.

- [ ] **Step 4: Run authentication tests**

Run: `npm test -- server/adminAuth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit only authentication files**

```bash
git add server/adminAuth.ts server/adminAuth.test.ts package.json package-lock.json
git commit -m "feat: add secure admin authentication primitives"
```

### Task 3: Bounded MongoDB enquiry reads and protected admin APIs

**Files:**
- Modify: `server/enquiryRepository.ts`
- Modify: `server/enquiryRepository.test.ts`
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`

**Interfaces:**
- Produces: `EnquiryRepository.listRecent(limit: number): Promise<Enquiry[]>` and endpoints `POST /api/admin/login`, `GET /api/admin/session`, `GET /api/admin/enquiries`, `POST /api/admin/logout`.
- Consumes: Task 2 authentication primitives and runtime admin environment values.

- [ ] **Step 1: Write failing repository and API tests**

```ts
expect(await repository.listRecent(50)).toEqual(expectedNewestFirst)
expect((await request(app).get('/api/admin/enquiries')).status).toBe(401)
expect((await login(app, validCredentials)).headers['set-cookie'][0]).toContain('gauvis_admin_session=')
expect((await authenticatedGet(app, '/api/admin/enquiries')).body.enquiries).toEqual(expected)
```

- [ ] **Step 2: Run targeted tests and verify expected failures**

Run: `npm test -- server/enquiryRepository.test.ts server/app.test.ts`
Expected: FAIL because list and admin routes are absent.

- [ ] **Step 3: Implement fixed-query repository read and protected routes**

Use `.find({}, { projection })`, `.sort({ createdAt: -1 })`, and `.limit(Math.min(Math.max(limit, 1), 100))`. Return generic `401`, `429`, and `503` responses, use `Cache-Control: no-store`, validate Origin on login/logout, and never include secrets.

- [ ] **Step 4: Run repository and API tests**

Run: `npm test -- server/enquiryRepository.test.ts server/app.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit only repository and API files**

```bash
git add server/enquiryRepository.ts server/enquiryRepository.test.ts server/app.ts server/app.test.ts
git commit -m "feat: add protected enquiry administration API"
```

### Task 4: Lazy routes, route CSS, and dependency isolation

**Files:**
- Create: `src/styles/base.css`
- Create: `src/styles/home.css`
- Create: `src/styles/about.css`
- Create: `src/styles/services.css`
- Create: `src/styles/solutions.css`
- Create: `src/styles/faq.css`
- Create: `src/styles/contact.css`
- Create: `src/styles/admin.css`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Delete: `src/styles.css`
- Modify: each module in `src/pages/`

**Interfaces:**
- Produces: lazy page modules and route-owned style chunks.
- Consumes: React `lazy`/`Suspense`, existing route components, and current selectors without visual redesign.

- [ ] **Step 1: Write failing route-loading tests**

```tsx
renderAt('/about')
expect(await screen.findByRole('heading', { level: 1, name: /technology partner/i })).toBeVisible()
expect(screen.queryByText(/loading page/i)).not.toBeInTheDocument()
```

Add a module-import test asserting `App.tsx` contains no static page imports and no `motion/react` or `gsap` import.

- [ ] **Step 2: Run App tests and verify expected failure**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because routes are statically imported and the shell imports Motion.

- [ ] **Step 3: Split styles and implement lazy route boundaries**

Use `lazy(() => import('./pages/About').then(({ About }) => ({ default: About })))`, a shared Suspense fallback, CSS route transitions, and one stylesheet import per page module. Keep Home’s Motion and GSAP imports inside `Home.tsx`.

- [ ] **Step 4: Run App tests and production build inspection**

Run: `npm test -- src/App.test.tsx && npm run build`
Expected: PASS and `dist/assets/` contains route-specific JS/CSS chunks.

- [ ] **Step 5: Commit only route and stylesheet files**

```bash
git add src/main.tsx src/App.tsx src/App.test.tsx src/pages src/styles src/styles.css
git commit -m "perf: lazy load routes and route styles"
```

### Task 5: Responsive high-resolution image library

**Files:**
- Create: `scripts/generate-responsive-images.mjs`
- Create: `src/imageAssets.ts`
- Create: `src/imageAssets.test.ts`
- Create: `src/components/ResponsiveImage.tsx`
- Create: `src/components/ResponsiveImage.test.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: relevant modules in `src/pages/`
- Generate: `public/generated/**/*.webp`

**Interfaces:**
- Produces: typed page image maps and `ResponsiveImage` props `{ alt, eager?, image, sizes, className? }`.
- Consumes: named PNG/SVG files under `public/GauvisTech_individual_images/`.

- [ ] **Step 1: Write failing mapping and markup tests**

```ts
expect(pageImages.services.cards).toHaveLength(8)
expect(pageImages.about.hero.src).toContain('01-about-hero')
```

```tsx
expect(screen.getByRole('img')).toHaveAttribute('srcset')
expect(screen.getByRole('img')).toHaveAttribute('width', '1536')
expect(screen.getByRole('img')).toHaveAttribute('height', '1024')
```

- [ ] **Step 2: Run image tests and verify expected failures**

Run: `npm test -- src/imageAssets.test.ts src/components/ResponsiveImage.test.tsx`
Expected: FAIL because image maps and component do not exist.

- [ ] **Step 3: Install Sharp, implement generator, and build derivatives**

Run: `npm install --save-dev sharp`

Generate 480-, 768-, 1024-, and 1536-pixel WebP derivatives at quality 80, without upscaling or deleting sources. Copy preferred SVG logos directly through public URLs.

- [ ] **Step 4: Replace page imagery and verify mappings**

Map every named image to its matching section, set the current route’s hero to eager/high priority, and keep all below-fold images lazy.

Run: `npm test -- src/imageAssets.test.ts src/components/ResponsiveImage.test.tsx src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit image pipeline and mappings**

```bash
git add scripts/generate-responsive-images.mjs src/imageAssets.ts src/imageAssets.test.ts src/components/ResponsiveImage.tsx src/components/ResponsiveImage.test.tsx src/pages public/generated package.json package-lock.json
git commit -m "perf: use responsive high resolution page imagery"
```

### Task 6: Admin dashboard and production enquiry gate

**Files:**
- Create: `src/features/admin/adminApi.ts`
- Create: `src/features/admin/adminApi.test.ts`
- Create: `src/pages/AdminLogin.tsx`
- Create: `src/pages/AdminEnquiries.tsx`
- Modify: `src/App.tsx`
- Modify: `src/features/contact/QuoteForm.tsx`
- Modify: `src/features/contact/useQuoteForm.ts`
- Modify: `src/App.test.tsx`
- Modify: `src/styles/admin.css`
- Modify: `src/styles/contact.css`

**Interfaces:**
- Produces: typed `login`, `logout`, `getSession`, and `getEnquiries` browser functions plus lazy admin routes.
- Consumes: Task 3 admin endpoints and `VITE_ENABLE_ENQUIRIES`.

- [ ] **Step 1: Write failing API and UI tests**

```ts
expect(await login({ username: 'admin', password: 'secret' })).toEqual({ authenticated: true })
```

```tsx
renderAt('/admin/login')
expect(await screen.findByRole('heading', { name: /admin sign in/i })).toBeVisible()
expect(screen.getByRole('button', { name: /submit enquiry/i })).toBeDisabled()
```

- [ ] **Step 2: Run targeted frontend tests and verify expected failures**

Run: `npm test -- src/features/admin/adminApi.test.ts src/App.test.tsx`
Expected: FAIL because admin modules and disabled state do not exist.

- [ ] **Step 3: Implement the minimal admin UI and enquiry gate**

Use `credentials: 'same-origin'`, no token storage in JavaScript, accessible labels/status messages, a semantic enquiries table on wide screens, stacked records on narrow screens, and phone/WhatsApp fallbacks on the disabled public form.

- [ ] **Step 4: Run frontend tests and browser checks**

Run: `npm test -- src/features/admin/adminApi.test.ts src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit admin frontend files**

```bash
git add src/features/admin src/pages/AdminLogin.tsx src/pages/AdminEnquiries.tsx src/features/contact src/App.tsx src/App.test.tsx src/styles/admin.css src/styles/contact.css
git commit -m "feat: add secure enquiry admin dashboard"
```

### Task 7: Generate deployment credentials and initialize MongoDB

**Files:**
- Modify locally only: `.env`
- Modify: `.env.example`
- Create: `scripts/generate-admin-credentials.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET_KEY`, `ENABLE_ENQUIRIES`, and `TRUST_PROXY` configuration values.
- Consumes: Task 2 `hashPassword` and cryptographically secure randomness.

- [ ] **Step 1: Add a credential-generation test through the auth primitive suite**

Verify generated passwords contain at least 24 random URL-safe characters and JWT secrets decode to at least 32 bytes.

- [ ] **Step 2: Run the test and verify expected failure**

Run: `npm test -- server/adminAuth.test.ts`
Expected: FAIL because credential generation does not exist.

- [ ] **Step 3: Implement and run the one-time credential generator**

Run: `npm run admin:credentials`

Write only hash/secret/config values to ignored `.env`, print the username and one-time password once, and never print MongoDB values or the JWT secret.

- [ ] **Step 4: Initialize MongoDB**

Run: `npm run db:setup`
Expected: exit 0 and output naming `gauvistech`, `enquiries`, `_id_`, `createdAt_desc`, and `status_createdAt_desc` without printing a URI.

- [ ] **Step 5: Commit only safe generator/documentation files**

```bash
git add scripts/generate-admin-credentials.ts package.json .env.example
git commit -m "chore: add safe admin credential setup"
```

### Task 8: Full production verification

**Files:**
- Modify as failures require: files already owned by Tasks 1–7.
- Do not modify secrets or deferred legal/domain files.

**Interfaces:**
- Consumes: complete implementation.
- Produces: evidence-backed production handoff.

- [ ] **Step 1: Run all automated quality gates**

```bash
npm test
npm run typecheck
npm run lint
npm run doctor
npm run build
npm audit --omit=dev
```

Expected: all commands exit 0; audit has no production vulnerabilities.

- [ ] **Step 2: Inspect production chunks**

Confirm each public/admin route has a separate JS/CSS asset and that the application shell does not import Motion or GSAP.

- [ ] **Step 3: Run production browser verification**

Run preview and test home, about, services, solutions, FAQ, contact, admin login, admin logout, authenticated enquiry list, mobile navigation, keyboard navigation, responsive images, and disabled enquiry messaging at 390×844 and 1440×900.

- [ ] **Step 4: Review the requirement checklist and working tree**

Verify each spec section has implementation evidence, inspect `git diff --check`, and confirm `.env` is ignored and unstaged.

- [ ] **Step 5: Report the handoff**

Provide the local and future public admin URLs, one-time username/password, MongoDB setup result, proxy variable guidance, build/test evidence, deferred domain/legal items, and any remaining deployment-only actions.
