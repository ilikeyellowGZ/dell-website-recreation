# Gauvis Tech Website Design Contract

## 1. Source and intent

The approved visual references are:

- Homepage: `pictures/ChatGPT Image Sep 11, 2026, 08_42_25 PM.png`
- About page: `pictures/a3228311-2ad9-4cf5-8565-67cf1e577e6d.png`
- Contact page: `pictures/b88bc9d6-f2cd-4f70-a769-dbcef539595f.png`
- Services page: `pictures/47500cdb-dad1-4b55-86da-cf51840a8eb1.png`
- Case Studies page: `pictures/30a3f00b-57e1-427d-9c26-714892264e48.png`
- FAQ page: `pictures/104f9e2f-49be-4b24-8a5d-943516574ba1.png`

These pages are faithful screenshot recreations, not redesigns. The implementation uses React and TypeScript with shared site components.

- Routes in scope: `/`, `/about`, `/services`, `/contact`, `/case-studies`, and `/faq`
- Audience: South African businesses seeking practical IT services
- Character: credible, technical, compact, high-contrast
- Dials: design variance 4, motion intensity 3 on About, visual density 6
- Memorable device: deep navy sections, orange calls to action, and blue/orange technology photography

## 2. Tokens

### Color

- `--navy-950: #061a33` utility bar and footer base
- `--navy-900: #08294f` hero and process surfaces
- `--navy-800: #0b315e` secondary dark surfaces
- `--navy-700: #12497f` blue icon circles and dark borders
- `--orange-500: #f15a29` primary accent and CTA
- `--orange-600: #d9471b` CTA hover
- `--ink: #0b2c55` headings on light surfaces
- `--text: #53677f` body copy on light surfaces
- `--pale: #edf4fa` nationwide support and other light-blue surfaces
- `--line: #dbe5ef` light dividers and card borders
- `--field-line: #c7d7e7` Contact form and contact-card borders
- `--error: #b42318` inline form validation text and invalid field borders
- `--white: #ffffff`

### Typography

- Family: Barlow, then system sans-serif
- Display: 700-800 weight, tight tracking, 1.04-1.2 line height
- Body: 400-500 weight, 1.55-1.75 line height
- Eyebrows: 700-800 weight, uppercase, 0.14-0.18em tracking
- Scale: 11, 12, 13, 14, 15, 18, 22, 28, 34, 48, 58px, with fluid heading scaling

### Space and shape

- Base spacing unit: 4px
- Main site shell: fluid, full width, no desktop max-width
- Desktop gutter: `clamp(28px, 6vw, 64px)`
- Mobile gutter: 20px
- Radius: 4-6px for buttons and bordered content, 0 for full-width sections
- Section spacing: 54-74px desktop, 44-56px mobile

## 3. Shared layout grammar

1. Compact navy utility bar with the South Africa service message.
2. White sticky header with logo, single-line navigation, active orange underline, and quote CTA.
3. Full-width sections with fluid horizontal gutters and no 1440px or other desktop content cap.
4. Short navy CTA banner before the footer.
5. Deep navy four-column footer and compact copyright strip.

## 4. About page reference geometry

1. Split navy hero with breadcrumb and copy on the left and technician/server photography on the right.
2. White story section with a left text column and wide workplace photograph on the right.
3. White expectation section with three bordered items.
4. Navy process section with four stages, blue icon circles, fine dividers, and orange arrows.
5. Pale-blue nationwide support split with text and CTA on the left and service imagery on the right.
6. Short city-network CTA band.
7. Shared footer.

The exact About photographs are present only inside the approved composite mockup. Until standalone originals are supplied, those approved regions may be shown through tightly clipped media frames. They must never be used as a whole-page screenshot replacement.

## 5. Responsive behavior

- Below 1024px: desktop navigation becomes an accessible disclosure menu; split layouts remain two-column only when their content fits.
- Below 768px: hero, story, and nationwide sections stack in reading order; expectation items and process stages stack or use two columns; footer columns reduce.
- Below 560px: content grids become one column and CTA controls can become full width.
- Media frames preserve their reference aspect ratios and crop intentionally with `object-fit` or clipped approved-reference regions.
- The page must reflow at 320px, support 200% zoom, and never create horizontal page scrolling.

## 6. Contact page reference geometry and states

1. Short split navy hero with the breadcrumb and two-line heading on the left, a server-aisle image on the right, a navy-to-transparent blend at the join, and the orange diagonal accent at the trailing edge.
2. White enquiry section with a narrower contact-information column and a wider bordered form card. At the 1024px reference width, the left column is about one third of the content area and the form is about two thirds.
3. Contact cards show only the confirmed phone names/numbers and “Serving South Africa”; the pale-blue panel communicates on-site assistance without adding an address.
4. The quote form has paired name/business and email/phone rows, followed by full-width service, location, message, consent, and submit controls. Fields expose default, hover, focus-visible, invalid, and disabled/pending-ready states.
5. Client validation keeps entered values, connects inline messages to their fields, and focuses the first invalid field. Because no enquiry service is configured, an otherwise-valid submit announces the missing integration and never shows a success state.
6. The WhatsApp action keeps the approved button appearance but remains unavailable until the user confirms whether Thabang or Pontsho receives enquiries; no phone is selected implicitly.
7. Pale-blue “What happens next?” section contains the approved three steps and stacks at narrow widths.
8. `#request-quote` uses sticky-header-safe scroll margin. All Request a Quote controls route to `/contact#request-quote`.

## 7. Reusable React primitives and states

- `SiteHeader`: utility bar, brand, desktop nav, accessible mobile disclosure, active route state.
- `SiteFooter`: reusable brand, quick links, services, confirmed phone contacts, and legal strip.
- `ButtonLink`: primary, outline, and light variants with hover, active, focus-visible, and reduced-motion behavior.
- `SectionEyebrow`: compact orange section label, used only where the reference includes one.
- `Icon`: one Phosphor icon family with consistent weight.
- `ReferencePhoto`: fixed-ratio clipped media frame for approved imagery embedded in a reference composite.
- `Home`: the preserved homepage at `/`.
- `About`: the approved About page at `/about`.
- `Contact`: the approved Contact page at `/contact`, including local validation and truthful unconfigured-delivery feedback.
- `Services`: the approved Services catalogue at `/services`, using a reusable service-card data structure and routing enquiry links to `/contact#request-quote`.
- `CaseStudies`: the approved illustrative project examples page at `/case-studies`, including category filters, result announcements, persistent illustrative-example badges, and an accessible scope dialog.
- `FAQ`: the approved FAQ page at `/faq`, including static category/search filtering, accessible accordion controls, empty state, and disabled WhatsApp action until a recipient is configured.

## 8. Motion

- The About mockup does not specify decorative animation, so it remains static apart from interaction feedback and mobile-menu state.
- The Contact mockup and brief do not specify decorative animation, so Contact remains static apart from focus, hover, press, validation, and mobile-menu state feedback.
- The preserved homepage may retain its restrained hero hierarchy and in-view reveals.
- Only transforms and opacity animate.
- All automatic motion honors `prefers-reduced-motion`; menu state changes remain immediate and usable.

## 9. Accessibility and content constraints

- One `h1` per route, coherent heading order, semantic landmarks, a skip link, native links and buttons.
- On SPA route changes, update the document title, scroll to the top, and focus the route heading.
- Visible 2px focus ring, 44px touch targets, descriptive image alternatives, and decorative imagery hidden from assistive technology.
- About is marked with `aria-current="page"` on `/about`, Contact on `/contact`, and Home only on `/`.
- Services is marked with `aria-current="page"` on `/services`.
- Case Studies is marked with `aria-current="page"` on `/case-studies`.
- FAQ is marked with `aria-current="page"` on `/faq`.
- Do not invent services, claims, certifications, statistics, testimonials, employees, projects, addresses, hours, or email addresses.
- Confirmed phone destinations are Thabang at 084 035 6925 and Pontsho at 064 367 0274.
- Quote CTAs use `/contact#request-quote`.
- No form endpoint or established WhatsApp destination exists. The page must not invent either integration, simulate delivery, or imply a successful enquiry.

## 10. Services page reference geometry

1. Shared utility bar and white navigation, with Services active.
2. Navy split hero with breadcrumb, the two-line heading `IT Services for` / `Every Business Need.`, the approved supporting sentence, server-rack image, and orange diagonal accent at the far right.
3. White service catalogue with eight image cards in two desktop columns and four rows. Each card has a fixed-ratio photograph, title, short description, orange vertical accent, and an enquiry link aligned to the trailing edge.
4. Service cards use the exact order and copy from the approved mockup: Hardware Support, Software Solutions, Networking Services, PC & Desktop Support, Microsoft 365 Support, CCTV & Security, Printer Services, Website Development.
5. Navy CTA band with the approved `Not sure where to start?` heading, support copy, orange `Talk to Us` button, city imagery, and diagonal orange treatment.
6. Enquiry links and CTA controls go to `/contact#request-quote`; no service detail pages or automatic service selection are claimed.

## 11. Case Studies page reference geometry and states

1. Shared utility bar and white navigation, with Case Studies active.
2. Navy split hero with breadcrumb, the two-line heading `Practical Solutions.` / `Projects in Focus.`, the approved supporting sentence, server-rack imagery, and an orange diagonal accent.
3. White project-example section with the pale-orange disclosure panel text `Illustrative project examples.`, filter buttons for All Projects, Networking, Security, Websites, and IT Support, and a two-column desktop project grid.
4. Project cards use only the approved illustrative examples: Office Network Setup, Business CCTV Installation, Business Website Design, and Workstation & Microsoft 365 Setup. Every card retains an `ILLUSTRATIVE EXAMPLE` badge and approved category, title, and description.
5. Filters are native buttons with `aria-pressed`; an assistive-status message announces the number of visible illustrative examples.
6. Because no valid project-detail route exists, `Explore project scope` opens an accessible dialog containing only the approved title, category, illustrative-example disclosure, approved description, and a `Discuss Your Project` link to `/contact#request-quote`.
7. Navy process band uses the approved Understand, Plan, Deliver stages and descriptions from the reference.
8. Final CTA routes to `/contact#request-quote`.

## 12. FAQ page reference geometry and states

1. Shared utility bar and white navigation, with FAQ active.
2. Navy split hero with breadcrumb, orange eyebrow `FREQUENTLY ASKED QUESTIONS`, the two-line heading `Clear Answers.` / `Confident Decisions.`, the approved supporting sentence, server imagery, and orange diagonal accent.
3. White FAQ area includes a labelled search field, desktop category navigation, and the accordion panel headed by the active category.
4. General is selected initially and the first approved answer is expanded initially.
5. The FAQ dataset contains only the six approved questions and answers. Other categories filter the same dataset by relevant tags rather than adding new copy.
6. Search is client-side and case-insensitive across question and answer text. Search and category selection work together; an accessible empty state offers `Clear search`.
7. Accordion question headings contain native buttons with `aria-expanded` and `aria-controls`.
8. Assistance panel includes `Contact Us` routed to `/contact`; `WhatsApp Us` remains disabled because no established WhatsApp destination exists.
9. Final CTA routes to `/contact#request-quote`.

## 13. Unresolved destinations

- `/solutions` has no approved page yet and remains disabled in shared navigation/footer.
- Privacy Policy and Terms & Conditions have no approved content or routes; they remain non-linked footer labels.
- No WhatsApp recipient has been configured, so WhatsApp buttons remain disabled and do not select Thabang or Pontsho implicitly.
