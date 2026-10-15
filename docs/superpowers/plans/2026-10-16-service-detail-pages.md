# Service Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every service card a dedicated URL and a responsive detail page that explains the selected service and leads visitors to request a quote.

**Architecture:** Define the eight services once in a typed catalogue, then use that catalogue for card links, slug validation, metadata, related services, and one reusable detail-page template. React Router owns `/services/:serviceSlug`; invalid slugs render an explicit in-layout not-found state instead of falling through to Home.

**Tech Stack:** React 19, TypeScript 6, React Router 7, Vitest, Testing Library, CSS, Vite

**Spec:** `docs/superpowers/specs/2026-10-16-service-detail-pages-design.md`

## Global Constraints

- Keep `/services` as the service catalogue route.
- Support exactly the eight approved detail routes from the spec.
- Reuse existing responsive service images; do not add image assets.
- Use the existing Barlow, navy/orange tokens, shell widths, radii, focus treatment, and breakpoints from `DESIGN.md`.
- Do not invent certifications, response-time guarantees, vendor partnerships, prices, or quantified results.
- Every valid detail page ends with a `/contact#request-quote` CTA.
- Unknown service slugs must render a useful not-found state and must not fall through to Home.
- Preserve heading focus, scroll restoration, reduced-motion behavior, and active Services navigation.

## File Structure

- Create `src/services/serviceCatalogue.ts`: typed service records, slug lookup, card summaries, related-service relationships, and page copy.
- Create `src/services/serviceCatalogue.test.ts`: completeness, slug uniqueness, relationship, and lookup tests.
- Create `src/pages/ServiceDetail.tsx`: reusable valid-service template and invalid-slug state.
- Create `src/styles/service-detail.css`: detail hero, content, benefits, process, related-card, not-found, and responsive styles.
- Modify `src/pages/Home.tsx`: source homepage service cards from the catalogue and link each card to its detail route.
- Modify `src/pages/Services.tsx`: source catalogue cards from the shared catalogue and make each card open its detail route.
- Modify `src/App.tsx`: lazy detail route, dynamic title handling, and Services active state for nested routes.
- Modify `src/App.test.tsx`: route, content, link, metadata, active-navigation, invalid-slug, and card-destination coverage.
- Modify `tests/site.browser.py`: representative browser coverage for desktop/mobile detail pages and card navigation.
- Modify `DESIGN.md`: replace the old no-detail-page constraint with the approved detail-page contract.

---

### Task 1: Define the service catalogue and design contract

**Files:**
- Create: `src/services/serviceCatalogue.ts`
- Create: `src/services/serviceCatalogue.test.ts`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: `ServiceSlug`, `ServiceRecord`, `serviceCatalogue`, `getServiceBySlug(slug: string | undefined): ServiceRecord | undefined`, and `serviceHref(slug: ServiceSlug): string`.
- `ServiceRecord` contains `slug`, `title`, `homeTitle`, `summary`, `alt`, `imageIndex`, `metaTitle`, `heroLead`, `overview`, `capabilities`, `benefits`, `process`, and `relatedSlugs`.
- Later tasks consume the catalogue in its declared array order and use `imageIndex` to read `pageImages.services.cards[imageIndex]`.

- [ ] **Step 1: Write failing catalogue tests**

Create `src/services/serviceCatalogue.test.ts` with tests that enforce the exact slugs, unique slugs, complete content, valid image indexes, valid related slugs, and safe lookup:

```ts
import { describe, expect, it } from 'vitest'
import { getServiceBySlug, serviceCatalogue, serviceHref } from './serviceCatalogue'

const expectedSlugs = [
  'hardware-support',
  'software-solutions',
  'networking-services',
  'pc-desktop-support',
  'microsoft-365-support',
  'cctv-security',
  'printer-services',
  'website-development',
] as const

describe('serviceCatalogue', () => {
  it('contains the eight approved services once and in catalogue order', () => {
    expect(serviceCatalogue.map(({ slug }) => slug)).toEqual(expectedSlugs)
    expect(new Set(serviceCatalogue.map(({ slug }) => slug)).size).toBe(serviceCatalogue.length)
  })

  it('provides complete, internally valid detail-page content', () => {
    const knownSlugs = new Set(expectedSlugs)
    for (const [index, service] of serviceCatalogue.entries()) {
      expect(service.imageIndex).toBe(index)
      expect(service.capabilities.length).toBeGreaterThanOrEqual(4)
      expect(service.benefits.length).toBeGreaterThanOrEqual(3)
      expect(service.process).toHaveLength(3)
      expect(service.relatedSlugs.length).toBeGreaterThanOrEqual(2)
      expect(service.relatedSlugs).not.toContain(service.slug)
      expect(service.relatedSlugs.every((slug) => knownSlugs.has(slug))).toBe(true)
      expect(serviceHref(service.slug)).toBe(`/services/${service.slug}`)
    }
  })

  it('returns a service only for a supported slug', () => {
    expect(getServiceBySlug('hardware-support')?.title).toBe('Hardware Support')
    expect(getServiceBySlug('not-a-service')).toBeUndefined()
    expect(getServiceBySlug(undefined)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run: `npm test -- src/services/serviceCatalogue.test.ts`

Expected: FAIL because `src/services/serviceCatalogue.ts` does not exist.

- [ ] **Step 3: Implement the typed catalogue**

Create the exported types and helpers exactly as follows, then populate all eight records with polished service-specific copy:

```ts
export const serviceSlugs = [
  'hardware-support', 'software-solutions', 'networking-services', 'pc-desktop-support',
  'microsoft-365-support', 'cctv-security', 'printer-services', 'website-development',
] as const

export type ServiceSlug = (typeof serviceSlugs)[number]

type ServiceProcessStep = { title: string; description: string }
type ServiceBenefit = { title: string; description: string }

export type ServiceRecord = {
  slug: ServiceSlug
  title: string
  homeTitle: string
  summary: string
  alt: string
  imageIndex: number
  metaTitle: string
  heroLead: string
  overview: readonly string[]
  capabilities: readonly string[]
  benefits: readonly ServiceBenefit[]
  process: readonly [ServiceProcessStep, ServiceProcessStep, ServiceProcessStep]
  relatedSlugs: readonly ServiceSlug[]
}

export const serviceCatalogue = [
  {
    slug: 'hardware-support',
    title: 'Hardware Support',
    homeTitle: 'Hardware Support',
    summary: 'Repairs, maintenance and upgrades for dependable business equipment.',
    alt: 'A technician repairing computer hardware inside a server rack',
    imageIndex: 0,
    metaTitle: 'Hardware Support | Gauvis Technology Holdings',
    heroLead: 'Keep business-critical computers and equipment dependable with practical hardware support.',
    overview: [
      'Unreliable equipment slows teams down and turns small faults into expensive interruptions. Gauvis helps businesses identify hardware problems, restore working systems and plan sensible upgrades.',
      'Support is shaped around the equipment you use and the way your team works, from individual workstations to wider office hardware requirements.',
    ],
    capabilities: ['Hardware fault assessment', 'Computer repairs and component replacement', 'Memory and storage upgrades', 'New device setup and configuration', 'Preventive maintenance guidance'],
    benefits: [
      { title: 'Less disruption', description: 'Resolve equipment issues before they keep people from doing their work.' },
      { title: 'Better device life', description: 'Use maintenance and targeted upgrades to get more value from existing equipment.' },
      { title: 'Practical decisions', description: 'Understand when repair, upgrade or replacement is the sensible next step.' },
    ],
    process: [
      { title: 'Assess', description: 'We review the affected hardware, symptoms and business impact.' },
      { title: 'Repair or upgrade', description: 'We agree on the appropriate work and configure the equipment for use.' },
      { title: 'Support', description: 'We confirm operation and help you plan any follow-up maintenance.' },
    ],
    relatedSlugs: ['pc-desktop-support', 'networking-services', 'printer-services'],
  },
] satisfies readonly ServiceRecord[]

const servicesBySlug = new Map(serviceCatalogue.map((service) => [service.slug, service]))

export function getServiceBySlug(slug: string | undefined): ServiceRecord | undefined {
  return slug ? servicesBySlug.get(slug as ServiceSlug) : undefined
}

export function serviceHref(slug: ServiceSlug): string {
  return `/services/${slug}`
}
```

Continue the literal array with seven complete records using the following exact content requirements (the wording may be polished without changing the claim):

- Software Solutions (`software-solutions`, image 1): summary `Development, testing and business applications shaped around how your team works.`; capabilities are requirements review, business application development, system integration, testing, and deployment support; benefits are closer process fit, fewer manual hand-offs, and a clearer path from idea to release; related services are Microsoft 365, Website Development, and PC & Desktop Support.
- Networking Services (`networking-services`, image 2): summary `Reliable wired and wireless connectivity for productive, connected teams.`; capabilities are network assessment, wired setup, wireless setup, device configuration, connectivity troubleshooting, and expansion planning; benefits are steadier access, better coverage, and room to grow; related services are Hardware Support, PC & Desktop Support, and CCTV & Security.
- PC & Desktop Support (`pc-desktop-support`, image 3): summary `Workstation setup, troubleshooting and day-to-day assistance for end users.`; capabilities are workstation setup, fault troubleshooting, user configuration, software installation, device onboarding, and ongoing assistance; benefits are faster onboarding, fewer everyday interruptions, and consistent workstation setup; related services are Hardware Support, Microsoft 365 Support, and Printer Services.
- Microsoft 365 Support (`microsoft-365-support`, image 4): summary `Practical help with Microsoft 365 accounts, email and productivity applications.`; capabilities are account setup, email configuration, productivity-app setup, access troubleshooting, user onboarding, and everyday support; benefits are easier collaboration, consistent user access, and less time lost to account problems; related services are PC & Desktop Support, Software Solutions, and Networking Services.
- CCTV & Security (`cctv-security`, image 5): summary `Camera installation and security-system setup for better visibility around your premises.`; capabilities are site assessment, camera placement planning, camera installation, recorder configuration, remote-viewing setup, and system checks; benefits are clearer coverage, easier monitoring, and a setup matched to the site; related services are Networking Services, Hardware Support, and Microsoft 365 Support.
- Printer Services (`printer-services`, image 6): summary `Printer installation, connectivity, troubleshooting and repair assistance.`; capabilities are printer installation, network connectivity, driver configuration, print fault diagnosis, device setup, and maintenance assistance; benefits are fewer printing interruptions, consistent access across teams, and practical repair-or-replace guidance; related services are PC & Desktop Support, Hardware Support, and Networking Services.
- Website Development (`website-development`, image 7): summary `Responsive business websites that communicate clearly across phones and desktops.`; capabilities are discovery and planning, information architecture, responsive frontend development, content integration, browser testing, launch support, and ongoing improvements; benefits are a clearer digital presence, a consistent cross-device experience, and an easier route for customers to enquire; related services are Software Solutions, Microsoft 365 Support, and CCTV & Security.

Every record uses a unique `metaTitle` in the form `<Title> | Gauvis Technology Holdings`, a plain-language `heroLead`, two overview paragraphs, the three process titles `Assess`, `Deliver`, and `Support`, and the matching existing image alt text from the current Services page.

- [ ] **Step 4: Update the design contract**

In `DESIGN.md`, replace Services rule 6 (`no service detail pages...`) with a rule stating that card titles and enquiry actions route to the matching `/services/:serviceSlug` page. Add a `Service detail page geometry and states` section documenting the breadcrumb, service hero, overview, capabilities, benefits, three-step process, related services, quote CTA, responsive stacking, and explicit unknown-slug state.

- [ ] **Step 5: Run catalogue tests and static checks**

Run: `npm test -- src/services/serviceCatalogue.test.ts && npm run typecheck`

Expected: catalogue tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit the catalogue and contract**

```bash
git add DESIGN.md src/services/serviceCatalogue.ts src/services/serviceCatalogue.test.ts
git commit -m "feat: define service detail catalogue"
```

---

### Task 2: Add the routed service-detail template

**Files:**
- Create: `src/pages/ServiceDetail.tsx`
- Create: `src/styles/service-detail.css`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `getServiceBySlug`, `serviceCatalogue`, `serviceHref`, `ServiceRecord`, `pageImages.services.cards`, `ButtonLink`, and `ResponsiveImage`.
- Produces: `ServiceDetail` route component mounted at `/services/:serviceSlug`.
- `App` derives the document title from `getServiceBySlug(serviceSlug)?.metaTitle`; invalid detail routes use `Service Not Found | Gauvis Technology Holdings`.

- [ ] **Step 1: Add failing valid-route and metadata tests**

Extend `src/App.test.tsx` with a `Service detail routes` describe block:

```ts
it('renders service-specific content and metadata for a valid slug', async () => {
  await renderRoute('/services/networking-services')

  expect(screen.getByRole('heading', { level: 1, name: 'Networking Services' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'What we can help with' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'What this means for your business' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'How we work with you' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Request a quote for Networking Services' })).toHaveAttribute(
    'href',
    '/contact#request-quote',
  )
  expect(document.title).toBe('Networking Services | Gauvis Technology Holdings')

  const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' })
  expect(within(primaryNavigation).getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page')
})
```

Add a parameterized test over all eight `[slug, title]` pairs that renders the route and asserts the level-one heading and breadcrumb current item.

- [ ] **Step 2: Add the failing unknown-slug test**

```ts
it('shows a useful service-not-found state for an unknown slug', async () => {
  await renderRoute('/services/unknown-service')

  expect(screen.getByRole('heading', { level: 1, name: 'Service not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'View all services' })).toHaveAttribute('href', '/services')
  expect(screen.getByRole('link', { name: 'Contact our team' })).toHaveAttribute('href', '/contact#request-quote')
  expect(document.title).toBe('Service Not Found | Gauvis Technology Holdings')
  expect(screen.queryByRole('heading', { name: /powering your digital future/i })).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run route tests and confirm the red state**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because no `/services/:serviceSlug` route or `ServiceDetail` component exists.

- [ ] **Step 4: Implement the route and dynamic route effects**

In `src/App.tsx`, lazy-load `ServiceDetail`, add `<Route path="/services/:serviceSlug" element={<ServiceDetail />} />` immediately after `/services`, and treat any pathname beginning with `/services/` as active page `services`.

Update `RouteEffects` to resolve nested service metadata without duplicating the catalogue:

```ts
const { pathname } = useLocation()
const serviceSlug = pathname.startsWith('/services/') ? pathname.slice('/services/'.length) : undefined
const service = getServiceBySlug(serviceSlug)

useEffect(() => {
  document.title = service?.metaTitle
    ?? (serviceSlug ? 'Service Not Found | Gauvis Technology Holdings' : routeTitles[pathname] ?? routeTitles['/'])
}, [pathname, service, serviceSlug])
```

- [ ] **Step 5: Implement the reusable page**

Create `src/pages/ServiceDetail.tsx`. Read `serviceSlug` with `useParams`, resolve it with `getServiceBySlug`, and branch before accessing content. The invalid branch must render `main#main-content`, a focusable `h1`, explanatory copy, `View all services`, and `Contact our team`.

The valid branch renders these exact landmarks/headings:

```tsx
<main id="main-content">
  <section className="service-detail-hero" aria-labelledby="service-detail-title">...</section>
  <section className="service-detail-overview" aria-labelledby="service-overview-title">...</section>
  <section className="service-detail-capabilities" aria-labelledby="service-capabilities-title">
    <h2 id="service-capabilities-title">What we can help with</h2>
  </section>
  <section className="service-detail-benefits" aria-labelledby="service-benefits-title">
    <h2 id="service-benefits-title">What this means for your business</h2>
  </section>
  <section className="service-detail-process" aria-labelledby="service-process-title">
    <h2 id="service-process-title">How we work with you</h2>
  </section>
  <section className="service-detail-related" aria-labelledby="service-related-title">
    <h2 id="service-related-title">Related services</h2>
  </section>
  <section className="service-detail-cta" aria-labelledby="service-cta-title">...</section>
</main>
```

Use `ResponsiveImage` with the selected card image, semantic lists for capabilities and process steps, linked related-service articles, and `ButtonLink` for the quote CTA. Give the CTA accessible text `Request a quote for ${service.title}`.

- [ ] **Step 6: Implement responsive styling**

Create `src/styles/service-detail.css` using only existing `DESIGN.md` tokens. Use a navy split hero, readable white/orange hierarchy, a two-column overview/capabilities composition on wide screens, three-column benefits/process cards, and a dark CTA band. At `48rem`, collapse split sections and three-column grids to one column; at `35rem`, make actions full-width. Include hover styles only under `@media (hover: hover)` and rely on the global focus and reduced-motion rules.

- [ ] **Step 7: Run route tests and static checks**

Run: `npm test -- src/App.test.tsx && npm run typecheck && npm run lint`

Expected: route tests PASS; TypeScript and ESLint exit 0.

- [ ] **Step 8: Commit the routed template**

```bash
git add src/App.tsx src/App.test.tsx src/pages/ServiceDetail.tsx src/styles/service-detail.css
git commit -m "feat: add service detail routes"
```

---

### Task 3: Point every service card to its dedicated route

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Services.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `serviceCatalogue` and `serviceHref` from `src/services/serviceCatalogue.ts`.
- Produces: homepage and catalogue card links whose accessible names identify the service and whose `href` is the matching dedicated route.

- [ ] **Step 1: Add failing card-destination tests**

In the homepage tests, assert each card destination with the shared catalogue:

```ts
for (const service of serviceCatalogue) {
  expect(screen.getByRole('link', { name: new RegExp(service.homeTitle, 'i') })).toHaveAttribute(
    'href',
    serviceHref(service.slug),
  )
}
```

Replace the current Services-page enquiry assertion with:

```ts
for (const service of serviceCatalogue) {
  expect(screen.getByRole('link', { name: `Learn more about ${service.title}` })).toHaveAttribute(
    'href',
    serviceHref(service.slug),
  )
}
```

Import `serviceCatalogue` and `serviceHref` at the top of `src/App.test.tsx`.

- [ ] **Step 2: Run the card tests and confirm the red state**

Run: `npm test -- src/App.test.tsx -t "Homepage route|Services route"`

Expected: FAIL because service cards still point to `/services` or `/contact#request-quote`.

- [ ] **Step 3: Refactor homepage cards to the shared catalogue**

Delete the local homepage `services` tuple. Map `serviceCatalogue`, use `service.homeTitle`, `service.alt`, `pageImages.services.cards[service.imageIndex]`, and set `href={serviceHref(service.slug)}`. Preserve animation timing by keeping the map index.

- [ ] **Step 4: Refactor Services catalogue cards**

Delete the local `services` constant in `src/pages/Services.tsx`. Change the card props to accept a `ServiceRecord`, derive the image by `imageIndex`, and make the card action a `Link` to `serviceHref(service.slug)` with visible text `Explore this service` and `aria-label={`Learn more about ${service.title}`}`.

- [ ] **Step 5: Run tests and static checks**

Run: `npm test -- src/App.test.tsx src/services/serviceCatalogue.test.ts && npm run typecheck && npm run lint`

Expected: all focused tests PASS; TypeScript and ESLint exit 0.

- [ ] **Step 6: Commit all card destinations**

```bash
git add src/pages/Home.tsx src/pages/Services.tsx src/App.test.tsx
git commit -m "fix: route service cards to matching details"
```

---

### Task 4: Verify responsive browser behavior and production readiness

**Files:**
- Modify: `tests/site.browser.py`
- Modify if visual defects are found: `src/styles/service-detail.css`

**Interfaces:**
- Consumes: the completed service catalogue, routes, page template, and card links.
- Produces: browser regression coverage for navigation, valid/invalid detail pages, viewport behavior, and quote destination.

- [ ] **Step 1: Add a failing browser navigation test**

Add a Playwright test that opens `/services`, clicks the `Learn more about Hardware Support` link, and verifies the URL, heading, active navigation, quote href, and main layout width:

```python
def test_service_card_opens_matching_detail_page(page, live_server):
    page.goto(f"{live_server}/services")
    page.get_by_role("link", name="Learn more about Hardware Support").click()
    expect(page).to_have_url(re.compile(r"/services/hardware-support$"))
    expect(page.get_by_role("heading", name="Hardware Support", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="Services", exact=True).first).to_have_attribute("aria-current", "page")
    expect(page.get_by_role("link", name="Request a quote for Hardware Support")).to_have_attribute(
        "href", "/contact#request-quote"
    )
```

Adapt only the existing fixture name or base-URL helper to match `tests/site.browser.py`; keep the assertions unchanged.

- [ ] **Step 2: Add mobile and unknown-route browser coverage**

At a `390x844` viewport, open `/services/website-development` and assert the `h1`, capabilities heading, related-services heading, and quote CTA are visible with no horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`). Open `/services/unknown-service` and assert `Service not found` plus the two recovery links.

- [ ] **Step 3: Run browser tests and confirm/fix failures**

Run the project’s existing browser-test command documented at the top of `tests/site.browser.py`. If it is direct pytest, run `python -m pytest tests/site.browser.py -q`.

Expected: new service-detail cases PASS in the same Chromium environment as the existing suite. Fix only service-detail CSS or test integration issues revealed by the run.

- [ ] **Step 4: Run the complete quality gate**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run doctor
```

Expected: all commands exit 0. The build emits the existing Vite bundle without missing-image or route errors. React Doctor reports no blocking warnings.

- [ ] **Step 5: Manually inspect representative pages**

Use a real Chromium browser at `390x844`, `768x1024`, and `1440x900`. Inspect `/services/hardware-support`, `/services/microsoft-365-support`, `/services/website-development`, and `/services/unknown-service`. Confirm heading wrapping, image cropping, keyboard focus, related links, no horizontal scrolling, active navigation, and the quote hash destination.

- [ ] **Step 6: Commit browser coverage and final visual fixes**

```bash
git add tests/site.browser.py src/styles/service-detail.css
git commit -m "test: verify service detail journeys"
```

## Final Review Checklist

- [ ] All eight homepage cards and all eight catalogue cards have unique matching `/services/:slug` destinations.
- [ ] All eight routes render service-specific overview, capabilities, benefits, process, related services, and quote CTA.
- [ ] Valid routes have unique titles and Services active; invalid routes show the explicit recovery state.
- [ ] No old card still points only to `/services` or directly to Contact.
- [ ] Mobile, tablet, and desktop layouts have no clipping or horizontal overflow.
- [ ] Unit, integration, browser, typecheck, lint, build, and React Doctor gates pass.
