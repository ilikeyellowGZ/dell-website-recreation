# GuavisTech Production Functionality, Security, Email, and SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete and verify the existing GuavisTech website's enquiry email flow, revocable idle-expiring admin authentication, interactions, technical SEO, and production safeguards without changing its approved design.

**Architecture:** Preserve the React UI, Express API, MongoDB repository, and Cloudflare Worker entry point. Consolidate shared email/auth contracts in server modules, use the existing Security Durable Object for production session and abuse state, and keep a process-local equivalent for the legacy Node runtime. Add route-aware metadata in React and static crawl assets for the canonical public URLs.

**Tech Stack:** React 19, React Router 7, TypeScript, Express 5, Cloudflare Workers/Durable Objects, MongoDB, Resend, Zod, Vitest, Playwright browser checks.

**Spec:** User-provided production implementation brief dated 2026-10-19.

## Global Constraints

- Preserve existing React components, styling, layout, animation, branding, colours, responsiveness, and UX.
- Keep all Resend operations server-side; never hardcode or expose API keys.
- Use `notification@guavistech.com` as sender and `info@gauvistech.com` as company recipient after deployment configuration is validated.
- Enforce a server-side 15-minute idle timeout and revocable logout.
- Do not claim delivery, deployment, Search Console verification, or indexing without external evidence.

---

### Task 1: Enquiry identity and email delivery contract

**Files:**
- Modify: `server/enquiryRepository.ts`
- Modify: `server/emailTemplates.ts`
- Modify: `server/enquiryNotifier.ts`
- Modify: `worker/notifier.ts`
- Modify: `server/app.ts`
- Test: `server/emailTemplates.test.ts`
- Test: `server/enquiryNotifier.test.ts`
- Test: `server/app.test.ts`

- [ ] Add a cryptographically random public enquiry reference at the API boundary and persist it with the record.
- [ ] Render the exact requested company/customer subjects and branded, escaped summaries including the reference and submission time.
- [ ] Read `COMPANY_NOTIFICATION_EMAIL` with a temporary legacy fallback and validate both sender and recipient header safety.
- [ ] Return an honest delivery state when persistence succeeds but notifications fail, without duplicating storage on client retry.
- [ ] Run focused notifier, template, and API tests.

### Task 2: Revocable admin sessions, idle expiry, and login alerts

**Files:**
- Modify: `server/adminAuth.ts`
- Modify: `server/app.ts`
- Modify: `worker/security-durable-object.ts`
- Modify: `worker/index.ts`
- Modify: `worker/types.ts`
- Modify: `src/features/admin/adminApi.ts`
- Modify: `src/pages/AdminEnquiries.tsx`
- Test: `server/adminAuth.test.ts`
- Test: `server/app.test.ts`
- Test: `src/features/admin/adminApi.test.ts`

- [ ] Add a session identifier to signed tokens and validate it through a server-side session authority.
- [ ] Create/touch sessions only for successful login and explicit meaningful admin activity; expire them after 15 idle minutes.
- [ ] Revoke the server session on logout and reject expired/revoked sessions on protected endpoints.
- [ ] Capture sanitized IP and user-agent details for successful-login alerts and thresholded failed-login alerts without secrets.
- [ ] Add a frontend activity heartbeat driven only by meaningful user events and redirect cleanly on expiry.
- [ ] Run focused authentication/API/UI tests.

### Task 3: Interaction and API completion

**Files:**
- Modify only existing public/admin components whose automated or browser checks show a broken visible control.
- Test: matching `src/**/*.test.tsx` and `tests/*.browser.py` files.

- [ ] Inventory links, buttons, forms, accordions, menus, filters, modals, logout, and protected-route behavior.
- [ ] Repair only reproduced failures, retaining the approved visual contract.
- [ ] Run component tests and browser interaction checks at mobile and desktop widths.

### Task 4: Route-aware technical SEO

**Files:**
- Create: `src/components/Seo.tsx`
- Modify: `src/App.tsx`
- Modify: public page modules only where headings/alt/internal links are deficient.
- Modify: `index.html`
- Create: `public/sitemap.xml`
- Modify: `public/robots.txt`
- Test: `src/App.test.tsx`

- [ ] Define unique titles, descriptions, canonicals, robots, Open Graph, and X metadata for every public route and service page.
- [ ] Add accurate Organization, WebSite, WebPage/Service, and BreadcrumbList JSON-LD from visible site facts.
- [ ] Mark admin routes `noindex,nofollow` and omit them from sitemap/robots crawl targets.
- [ ] Create the canonical sitemap and reference it from robots.txt.
- [ ] Verify metadata and structured data with automated assertions and a production browser.

### Task 5: Production configuration, hardening, and verification

**Files:**
- Modify: `.env.example`
- Modify: `wrangler.jsonc`
- Modify: `README.md`
- Modify: `DEPLOYMENT.md`
- Modify: tests as required for production guarantees.

- [ ] Update documented variable names and exact sender/recipient spellings without adding secrets.
- [ ] Add an actionable Resend-domain and Search Console manual checklist for checks that require account access.
- [ ] Run tests, typecheck, lint, production build, Worker dry-run, dependency audit, secret scan, React Doctor, and browser checks.
- [ ] Record verified results and clearly separate local completion from deployment/external-provider status.
