# MongoDB Contact Integration and Website Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store valid contact enquiries in MongoDB, route WhatsApp actions to Thabang, restore the existing project-owned Solutions page, and clear the reported Doctor and Vite build issues without publishing unapproved legal copy.

**Architecture:** A small Express server will own validation, rate limiting, MongoDB access, security headers, and production static hosting. The React form will call a same-origin `/api/enquiries` endpoint and expose pending, accepted, validation-error, unavailable, and retryable-failure states. The Solutions route will reuse the six solution records already present in the original design bundle, while the legal footer placeholders will be removed until reviewed content is supplied.

**Tech Stack:** React 19, React Router, TypeScript, Vite, Express, MongoDB Node driver, Zod, Helmet, express-rate-limit, Vitest, Testing Library, Playwright.

**Spec:** `DESIGN.md` and `project/Gauvis Tech Website.dc.html`

## Global Constraints

- Keep the confirmed contact numbers unchanged: Thabang `084 035 6925` and Pontsho `064 367 0274`.
- WhatsApp enquiries go to Thabang at `https://wa.me/27840356925`.
- Never expose `MONGODB_URI` or other credentials to client code, logs, source control, or API responses.
- Store only the submitted enquiry fields, consent, source, status, and server-generated creation time.
- Preserve Home, About, Services, Contact, Case Studies, and FAQ visual behavior.
- Do not publish Privacy Policy or Terms & Conditions text without approved legal content.
- Do not send a real business enquiry during verification.

---

### Task 1: Secure MongoDB enquiry API

**Files:**
- Create: `server/enquirySchema.ts`
- Create: `server/enquiryRepository.ts`
- Create: `server/app.ts`
- Create: `server/index.ts`
- Create: `server/app.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.node.json`
- Modify: `vite.config.ts`
- Modify: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces: `createApp({ enquiryRepository })`, `EnquiryRepository.insert(enquiry)`, and `POST /api/enquiries`.
- Response contract: `201 { accepted: true }`, `422 { accepted: false, code: "VALIDATION_ERROR", fieldErrors }`, `429` for rate limits, and `503` when database configuration is absent.

- [ ] Write node-environment tests that start the real Express app with an in-memory repository and verify accepted, malformed, oversized, honeypot, and repository-failure requests.
- [ ] Run the server test and confirm it fails because the server modules do not exist.
- [ ] Add the schema, repository, app factory, production entry point, dependencies, Vite proxy, environment template, and `.env` ignore rule.
- [ ] Run the server test and confirm every API branch passes.

### Task 2: Connect and decompose the Contact page

**Files:**
- Create: `src/features/contact/contactForm.ts`
- Create: `src/features/contact/ContactDetails.tsx`
- Create: `src/features/contact/QuoteForm.tsx`
- Create: `src/features/contact/NextSteps.tsx`
- Modify: `src/pages/Contact.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `POST /api/enquiries`.
- Produces: pending submit lock, success only after HTTP 201, retryable errors, preserved values on failure, field errors from HTTP 422, and a Thabang WhatsApp link.

- [ ] Replace the old unconfigured-delivery test with failing tests for pending, accepted, rejected, and unavailable requests, plus the exact Thabang WhatsApp destination.
- [ ] Run the Contact tests and confirm the old disabled WhatsApp and no-integration behavior fail.
- [ ] Extract Contact subcomponents and implement the real fetch flow with accessible status announcements.
- [ ] Run the Contact tests and confirm they pass without a Doctor giant-component warning.

### Task 3: Restore the project-owned Solutions route

**Files:**
- Create: `src/pages/Solutions.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/SiteHeader.tsx`
- Modify: `src/components/SiteFooter.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: `/solutions`, active navigation state, six responsive solution records, links to the existing Services and Contact routes.

- [ ] Add a failing route test asserting the project-owned heading, six solution situations, active navigation, and valid destinations.
- [ ] Run the test and confirm `/solutions` currently falls back to Home.
- [ ] Build the responsive route from the original bundle’s six solution records and register it in shared navigation/footer.
- [ ] Run the route test and confirm it passes.

### Task 4: Remove unresolved and static-analysis debt

**Files:**
- Modify: `src/components/SiteFooter.tsx`
- Modify: `package.json`
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: no dead legal labels, Doctor scoped to production React source, and separated vendor chunks below Vite’s warning threshold.

- [ ] Add assertions that the footer has no non-functional Privacy Policy or Terms & Conditions controls.
- [ ] Run the assertion and confirm it fails against the current footer.
- [ ] Remove the dead labels, scope Doctor to shipped React source, and define stable manual vendor chunks.
- [ ] Run Doctor and production build; require a clean Doctor result and no chunk-size warning.

### Task 5: Full verification and documentation

**Files:**
- Modify: `tests/site.browser.py`
- Modify: `README.md`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: repeatable local setup instructions and browser regression coverage for WhatsApp, Solutions, form validation, and non-destructive API failure behavior.

- [ ] Extend browser checks for `/solutions`, Thabang WhatsApp URLs, pending-safe form access, and all existing page routes at 360, 390, 768, 1024, and 1440 pixels.
- [ ] Run typecheck, lint, unit/API tests, Doctor, dependency audit, build, and browser checks.
- [ ] Run the repository update hook and `git diff --check`.
- [ ] Record that live MongoDB acceptance could not be tested until `MONGODB_URI` and `MONGODB_DB_NAME` are supplied, and that legal pages still require approved legal content.
