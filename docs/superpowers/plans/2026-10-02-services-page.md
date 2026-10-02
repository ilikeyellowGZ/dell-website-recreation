# Services Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Gauvis Tech Services page as a React route at `/services`.

**Architecture:** Reuse the existing shared header, footer, image assets, tokens, and route effects. Add a page-local service data structure plus a reusable `ServiceCatalogueCard` component, then update shared navigation links away from the legacy `services.html`.

**Tech Stack:** React 19, TypeScript, React Router, Vite, Phosphor icons, native CSS.

**Spec:** User prompt and approved screenshot at `pictures/47500cdb-dad1-4b55-86da-cf51840a8eb1.png`.

## Global Constraints

- Preserve existing Home, About, and Contact pages.
- Create or update only the Services React page and required shared routing/navigation links.
- Use the approved screenshot as source of truth and do not redesign it.
- Use service enquiry links as `/contact#request-quote` unless an established URL service-selection mechanism already exists.
- Do not create service detail pages or invent contact information.

---

### Task 1: Route And Link Coverage

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/SiteHeader.tsx`
- Modify: `src/components/SiteFooter.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: Existing `App`, shared header/footer, React Router.
- Produces: `/services` route, active Services nav state, existing Services links pointing to `/services`.

- [ ] **Step 1: Write the failing route/link test**

Add a test that renders `/services`, expects the approved heading and eight service titles, checks Services has `aria-current="page"`, and checks every service enquiry link points to `/contact#request-quote`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run`
Expected: FAIL because `/services` currently falls back to Home and Services nav still points to `/services.html`.

- [ ] **Step 3: Wire the route and shared links**

Import `Services`, register `/services`, extend the active-page union, and convert legacy service links in shared components and Home to React route destinations.

- [ ] **Step 4: Run tests to verify route/link coverage passes**

Run: `npm test -- --run`
Expected: PASS for the new route/link test and existing Home/About/Contact tests.

### Task 2: Services Page Visual Implementation

**Files:**
- Create: `src/pages/Services.tsx`
- Modify: `src/styles.css`
- Modify: `src/assets.ts` only if an asset import is missing.

**Interfaces:**
- Consumes: `assets`, `ButtonLink`, `Link`, and existing CSS tokens.
- Produces: Semantic Services page matching the approved hero, catalogue, CTA, and responsive behavior.

- [ ] **Step 1: Implement the Services component**

Use a `services` data array and reusable `ServiceCatalogueCard` component. Use the approved service titles, descriptions, image assets, alt text, and `/contact#request-quote` enquiry links.

- [ ] **Step 2: Add Services CSS using existing tokens**

Add `services-hero`, `service-catalogue`, `service-catalogue-card`, and `services-cta` rules. Preserve full-width layout, two-card desktop grid, one-column mobile stack, image ratios, orange accents, and no horizontal overflow.

- [ ] **Step 3: Extend browser checks**

Update `tests/site.browser.py` to load `/services`, verify refresh, active nav, service links, CTA destinations, mobile menu, health checks, and screenshots at the required widths.

- [ ] **Step 4: Run verification**

Run typecheck, lint, unit tests, build, browser suite, diff check, and React Doctor if available. Report any non-blocking existing findings separately.
