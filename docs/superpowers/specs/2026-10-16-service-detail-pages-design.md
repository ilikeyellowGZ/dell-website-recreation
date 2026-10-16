# Service Detail Pages Design

## Goal

Give every service card a dedicated, shareable destination that clearly explains the selected service and guides the visitor toward requesting a quote. A visitor who selects a service must never land on an unrelated or generic legacy page.

## Scope

The site will provide detail pages for these eight existing services:

1. Hardware Support
2. Software Solutions
3. Networking Services
4. PC & Desktop Support
5. Microsoft 365 Support
6. CCTV & Security
7. Printer Services
8. Website Development

The existing visual identity, navigation, footer, responsive behavior, and contact workflow remain in place. This work does not add checkout, booking, pricing, or a content-management system.

## Routes

Each service has a stable route:

- `/services/hardware-support`
- `/services/software-solutions`
- `/services/networking-services`
- `/services/pc-desktop-support`
- `/services/microsoft-365-support`
- `/services/cctv-security`
- `/services/printer-services`
- `/services/website-development`

All service cards on the homepage and Services page link to the matching route. The existing `/services` route remains the catalogue page.

An unrecognised `/services/:slug` value renders a clear service-not-found state with links back to the service catalogue and contact page. It must not silently show the homepage or an unrelated service.

## Architecture

Service content is stored as typed structured data. Each record owns its slug, page title, summary, image reference, introductory explanation, solution items, benefits, process copy, related-service slugs, and metadata.

A single reusable service-detail page reads the route slug, validates it against the service records, and renders the selected record. Shared layout avoids duplicated page components while preserving service-specific content and metadata. Catalogue cards consume the same records or shared slug mapping so labels and destinations cannot drift apart.

## Page Structure

Each detail page contains:

1. A breadcrumb showing `Home / Services / Service name`.
2. A service-specific hero with the existing matching service image, page heading, and concise value proposition.
3. An overview that explains the service, the business problems it addresses, and the type of support Gauvis provides.
4. A `What we can help with` section containing concrete service capabilities.
5. A benefits section describing practical business outcomes without unsupported guarantees.
6. A three-step process covering consultation, delivery, and ongoing support.
7. A related-services section linking to relevant detail pages.
8. A final CTA linking to `/contact#request-quote`.

Copy will be newly written from the approved service names and descriptions. It will be specific, plain-language, professional, and limited to credible capabilities already implied by the current site. It will not invent certifications, response-time guarantees, vendor partnerships, prices, or quantified results.

## Visual and Interaction Design

The pages follow `DESIGN.md`: Barlow typography, navy and orange palette, existing shell widths, radii, focus states, button treatment, and responsive breakpoints. Existing responsive service imagery will be reused rather than introducing new assets.

The hero and content sections establish a clear reading hierarchy rather than repeating the catalogue-card layout. Links expose descriptive accessible names. Related-service cards have visible hover and keyboard-focus states. Motion respects the existing reduced-motion behavior.

On narrow screens, split layouts collapse to one column, CTAs remain comfortably tappable, and long headings wrap without clipping. Desktop layouts retain readable line lengths and balanced image-to-copy proportions.

## Metadata and Navigation

Each valid service route receives a unique document title derived from its service name. The Services navigation item remains active for the catalogue and all service-detail routes. Route changes continue to focus the main heading and reset or restore scroll according to the existing application behavior.

## Error Handling

Unknown service slugs show an in-layout not-found message rather than throwing, rendering an empty page, or falling through to the homepage. Missing related-service records are excluded safely. Every page retains a route back to the service catalogue and a route to contact the team.

## Verification

Automated tests will verify:

- Every catalogue and homepage service card links to its matching dedicated route.
- All eight supported routes render the correct title and service-specific content.
- Detail routes set unique document titles and keep Services navigation active.
- Related-service and quote links point to valid destinations.
- An unknown slug renders the explicit not-found state.
- Route focus and scroll behavior continue to work.
- The production build and existing test suite pass.

Browser verification will cover representative mobile, tablet, and desktop widths, keyboard navigation, card destinations, content wrapping, and the quote CTA hash destination.

## Acceptance Criteria

1. Selecting any service card opens the matching dedicated service URL.
2. Each page clearly explains what that service covers, how it helps, and what the visitor can do next.
3. No service card points only to the generic `/services` page.
4. All eight pages use the existing design system and work across supported viewport sizes.
5. Unknown service URLs produce a useful not-found state.
6. The implementation passes automated and browser verification without regressing existing routes.
