# Gauvis Tech Contact Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved Gauvis Tech Contact page at `/contact`, connect site quote links to its form, and provide accessible client-side validation without pretending an unconfigured delivery service exists.

**Architecture:** Add one route-level React component that composes the existing site shell, header, footer, buttons, Phosphor icons, and design tokens. Keep validation state local to the Contact form, focus the first invalid field on submit, and expose truthful form-level feedback when no backend is configured. Update only shared navigation destinations/content that the approved Contact mockup makes authoritative.

**Tech Stack:** React 19, TypeScript, React Router, plain CSS, Vitest + Testing Library, Playwright browser checks.

**Spec:** `pictures/b88bc9d6-f2cd-4f70-a769-dbcef539595f.png` and the user-provided Contact-page requirements.

## Global Constraints

- Preserve `/` and `/about`; add only `/contact`.
- Use the screenshot as the visual source of truth and retain the project’s fluid, uncapped site shell.
- Use only Thabang `084 035 6925`, Pontsho `064 367 0274`, and “Serving South Africa”.
- Do not add an email address, physical address, hours, price, response guarantee, backend endpoint, or unconfirmed WhatsApp recipient.
- Route Request a Quote links to `/contact#request-quote`.
- Keep form values after validation or integration errors and never simulate successful delivery.
- Add no Contact-page animations beyond existing interaction feedback.

---

### Task 1: Document the Contact design contract

**Files:**
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: approved Contact mockup and existing design tokens.
- Produces: documented `/contact` geometry, form states, responsive rules, and unresolved integration rules.

- [ ] **Step 1: Update the design contract**

Add the Contact reference and route, the split server hero, two-column enquiry layout, quote form states, three-step pale-blue follow-up strip, Contact active navigation state, quote-anchor destination, and explicit no-backend/no-WhatsApp-recipient constraints.

- [ ] **Step 2: Review the contract against the mockup**

Verify every visible section, responsive state, and interaction requested by the spec has a documented counterpart.

### Task 2: Add failing route and form behavior tests

**Files:**
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `App` rendered in a `MemoryRouter`.
- Produces: regression coverage for `/contact`, active navigation, contact destinations, quote anchors, validation, and truthful unconfigured submission feedback.

- [ ] **Step 1: Write the failing Contact route test**

Assert the Contact heading and section headings render, Contact has `aria-current="page"`, Home links to `/`, and confirmed phone links use `tel:+27840356925` and `tel:+27643670274`.

- [ ] **Step 2: Write the failing validation test**

Submit empty data, assert inline required messages and focus on Full name; then enter malformed email/phone values and assert format-specific messages without clearing entered values.

- [ ] **Step 3: Write the failing unconfigured-submission test**

Enter a valid form, submit, assert the form reports that online delivery is unavailable and does not display a success state; assert all entered values remain.

- [ ] **Step 4: Run the unit suite and verify red**

Run `npm test -- --run src/App.test.tsx`; expect failure because `/contact` and its form do not yet exist and quote links still point to telephone destinations.

### Task 3: Implement Contact route, shared links, and validation

**Files:**
- Create: `src/pages/Contact.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/SiteHeader.tsx`
- Modify: `src/components/SiteFooter.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/About.tsx`
- Modify: `src/assets.ts`

**Interfaces:**
- Consumes: shared `SiteHeader`, `SiteFooter`, `ButtonLink`, existing asset map, React Router.
- Produces: `Contact` route component; active-page value `contact`; form anchor `request-quote`; confirmed `tel:` links; truthful validation status.

- [ ] **Step 1: Add the route and route metadata**

Import `Contact`, register `<Route path="/contact" element={<Contact />} />`, set the Contact title, and select `contact` as the shared header state on that pathname.

- [ ] **Step 2: Update shared navigation and quote destinations**

Change Contact links to `/contact`, add `aria-current="page"` when active, and route each “Request a Quote” control to `/contact#request-quote`.

- [ ] **Step 3: Implement the Contact component**

Compose semantic hero, contact cards, service-area/on-site panels, an intentionally unavailable WhatsApp button pending recipient selection, the quote form, and the three follow-up steps. Use native labels, required attributes, autocomplete, allowed service options, inline errors connected with `aria-describedby`, a stable `aria-live` region, and first-error focus.

- [ ] **Step 4: Add client-side validation**

Validate trimmed required values, email format, reasonable international phone formatting with 7–15 digits, allowed services, and consent. On otherwise-valid submit, report the absent delivery integration and preserve values; never show success.

- [ ] **Step 5: Run the unit suite and verify green**

Run `npm test -- --run src/App.test.tsx`; expect all route, link, and form tests to pass.

### Task 4: Match the approved Contact composition responsively

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Contact class names and existing design tokens.
- Produces: screenshot-faithful desktop geometry and stackable mobile layouts with no horizontal overflow.

- [ ] **Step 1: Style the desktop reference composition**

Match the 1024px mockup’s hero crop and diagonal accent, two-column contact/form proportions, bordered cards and fields, orange controls, pale-blue next-steps strip, and compact shared footer.

- [ ] **Step 2: Add content-led responsive rules**

At the existing navigation breakpoint keep the menu behavior; below the point where the two columns no longer fit, stack contact information before the form; stack field pairs and follow-up steps on narrow screens; retain 44px targets and 16px mobile field text.

- [ ] **Step 3: Review focus, zoom, and reduced-motion behavior**

Confirm focus rings remain visible, the quote anchor has sticky-header-safe scroll margin, the checkbox label is one hit target, and no Contact-specific automatic motion was introduced.

### Task 5: Browser verification and visual iteration

**Files:**
- Modify: `tests/site.browser.py`
- Create: `artifacts/contact-360.png`
- Create: `artifacts/contact-390.png`
- Create: `artifacts/contact-768.png`
- Create: `artifacts/contact-1024.png`
- Create: `artifacts/contact-1440.png`

**Interfaces:**
- Consumes: production preview server at `http://127.0.0.1:4173`.
- Produces: executable checks and visual evidence for route refresh, navigation, anchors, menu, form validation, images, and overflow.

- [ ] **Step 1: Extend the browser test**

Cover `/contact` direct load/reload, Home/About/Contact navigation, active states, Request a Quote anchor scrolling, telephone destinations, unavailable WhatsApp state, required/format validation, preserved values, and absence of false success.

- [ ] **Step 2: Start a production preview**

Run `npm run build`, then `npm run preview -- --host 127.0.0.1`.

- [ ] **Step 3: Run the browser helper correctly**

Run the project webapp-testing helper with `--help`, then execute `python tests/site.browser.py` against the preview server.

- [ ] **Step 4: Compare screenshots and iterate**

Inspect each generated Contact screenshot, compare the 1024px/desktop composition directly with the approved 1024×1536 reference, adjust spacing/crops/type, and repeat until remaining differences are documented.

### Task 6: Final quality gates

**Files:**
- Modify only files required to fix discovered issues.

**Interfaces:**
- Consumes: final source tree.
- Produces: fresh build, lint, type, unit, browser, React static-analysis, and design-guideline evidence.

- [ ] **Step 1: Run static and unit checks**

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`; fix introduced failures.

- [ ] **Step 2: Run React Doctor**

Run `npm run doctor -- --verbose`; fix Contact-related findings and report the final score honestly.

- [ ] **Step 3: Audit final UI source against the fetched Web Interface Guidelines**

Check final Contact/shared component files for semantic controls, labels, autocomplete, focus, error announcements, explicit image dimensions, hover states, mobile input sizing, and prohibited patterns.

- [ ] **Step 4: Re-run the browser suite after all fixes**

Run the full five-width browser test again so the final report is based on fresh evidence.
