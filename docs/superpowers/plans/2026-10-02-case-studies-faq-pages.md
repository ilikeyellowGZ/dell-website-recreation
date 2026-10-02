# Case Studies and FAQ Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Gauvis Tech Case Studies and FAQ pages in the existing React/Vite app, register `/case-studies` and `/faq`, and verify shared website navigation.

**Architecture:** Add two focused route components using the project’s existing shared header, footer, buttons, imagery crop helper, CSS tokens, and router. Case Studies owns its local filtering and dialog state; FAQ owns local category, search, and accordion state. Shared navigation/footer changes expose the new routes without changing completed pages.

**Tech Stack:** React 19, TypeScript, React Router, Vite, Phosphor Icons, CSS in `src/styles.css`, Vitest + Testing Library, Playwright browser verification.

**Spec:** User-provided prompt and approved mockups `pictures/30a3f00b-57e1-427d-9c26-714892264e48.png` and `pictures/104f9e2f-49be-4b24-8a5d-943516574ba1.png`.

## Global Constraints

- Preserve existing Home, About, Services, Contact pages and unrelated work.
- Use `/contact#request-quote` for quote/project discussion destinations.
- Do not invent services, project outcomes, clients, statistics, certifications, prices, email addresses, physical addresses, policies, or WhatsApp recipients.
- Use exact supplied Case Studies and FAQ copy from the prompt where provided.
- Keep Case Studies examples visibly labelled as illustrative examples.
- Reuse existing shared components and CSS tokens; do not introduce a new framework or dependency.
- Verify at 360px, 390px, 768px, 1024px, and 1440px.

---

### Task 1: Route tests for new pages and navigation

**Files:**
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: existing `renderRoute(route)` helper.
- Produces: failing expectations for `/case-studies`, `/faq`, active nav, filters, dialog, FAQ search, categories, accordion, and contact destinations.

- [ ] **Step 1: Write failing tests**

Add route tests that assert:
- `/case-studies` renders “Practical Solutions. Projects in Focus.”, all four approved project cards, accessible category filters, an “ILLUSTRATIVE EXAMPLE” badge, and a scope dialog opened by “Explore project scope”.
- `/faq` renders “Clear Answers. Confident Decisions.”, all six approved questions under General, first answer expanded initially, case-insensitive search, combined category filtering, empty state, disabled WhatsApp action if no destination exists, and quote/contact links.
- Header links expose Case Studies and FAQ and mark each active route with `aria-current="page"`.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- --run`
Expected: FAIL because `/case-studies` and `/faq` routes are not registered and nav links are disabled.

### Task 2: Add Case Studies and FAQ assets and route components

**Files:**
- Modify: `src/assets.ts`
- Create: `src/pages/CaseStudies.tsx`
- Create: `src/pages/FAQ.tsx`

**Interfaces:**
- Produces: `CaseStudies` and `FAQ` named exports.
- Uses: `assets.caseStudiesReference`, `assets.faqReference`, `ButtonLink`, `ReferencePhoto`.

- [ ] **Step 1: Add reference imports**

Import:
- `caseStudiesReference` from `../pictures/30a3f00b-57e1-427d-9c26-714892264e48.png`
- `faqReference` from `../pictures/104f9e2f-49be-4b24-8a5d-943516574ba1.png`

- [ ] **Step 2: Implement `CaseStudies`**

Create data arrays for the five filters, four project cards, and three process stages. Render the hero, disclosure, filters, two-column grid, accessible modal dialog, process section, and CTA.

- [ ] **Step 3: Implement `FAQ`**

Create the six approved FAQs with category tags. Render the hero, search, category navigation, accessible accordion, empty state, assistance panel, and final CTA.

- [ ] **Step 4: Run tests**

Run: `npm test -- --run`
Expected: still fail only for missing routes/nav if components compile.

### Task 3: Register routes and shared links

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/SiteHeader.tsx`
- Modify: `src/components/SiteFooter.tsx`

**Interfaces:**
- Consumes: `CaseStudies`, `FAQ` components.
- Produces: working `/case-studies` and `/faq` routes, active nav states, footer quick links.

- [ ] **Step 1: Register routes and titles**

Add document titles and `<Route>` entries for `/case-studies` and `/faq`.

- [ ] **Step 2: Update active-page logic**

Extend the active-page union to include `case-studies` and `faq`.

- [ ] **Step 3: Replace disabled nav/footer labels**

Make Case Studies and FAQ real links; leave Solutions disabled because no approved route exists.

- [ ] **Step 4: Run tests**

Run: `npm test -- --run`
Expected: route/navigation tests pass or reveal styling-independent behavior gaps.

### Task 4: Style the new pages against the approved mockups

**Files:**
- Modify: `src/styles.css`
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: existing CSS tokens and shared page grammar.
- Produces: full-width, responsive page styling for Case Studies and FAQ.

- [ ] **Step 1: Add desktop styles**

Add Case Studies and FAQ hero, card, filter, process, dialog, search, category, accordion, assistance, and CTA styles matching the screenshots.

- [ ] **Step 2: Add responsive styles**

Adapt layouts at existing breakpoints: stacked heroes and cards below 768px, wrapped filters, FAQ categories above accordion, safe dialogs, no horizontal scrolling.

- [ ] **Step 3: Update `DESIGN.md`**

Document the new routes, reference files, reusable project-card/dialog and FAQ accordion states, and unresolved WhatsApp/legal/Solutions destinations.

- [ ] **Step 4: Run checks**

Run: `npm run typecheck`, `npm run lint`, `npm test -- --run`, and `npm run build`.

### Task 5: Browser verification

**Files:**
- Modify: `tests/site.browser.py`

**Interfaces:**
- Consumes: preview server at `http://127.0.0.1:4173`.
- Produces: screenshots in `artifacts/` and automated interaction checks.

- [ ] **Step 1: Extend browser test**

Add direct loads, reloads, screenshots, nav checks, Case Studies filters/dialog, FAQ accordion/search/categories/empty state, and CTA destination checks.

- [ ] **Step 2: Run helper help**

Run: `python .agents/skills/webapp-testing/scripts/with_server.py --help`

- [ ] **Step 3: Run browser suite**

Run: `python .agents/skills/webapp-testing/scripts/with_server.py --server "npm run preview -- --host 127.0.0.1" --port 4173 -- python tests/site.browser.py`

- [ ] **Step 4: Run final hygiene**

Run: `git diff --check` and `C:/Users/omoku/.codex/hooks/gsd-check-update.cmd`.
