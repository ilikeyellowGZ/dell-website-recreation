# Gauvis Tech Website Design Contract

## 1. Source and intent

The approved visual references are:

- Homepage: `pictures/ChatGPT Image Sep 11, 2026, 08_42_25 PM.png`
- About page: `pictures/a3228311-2ad9-4cf5-8565-67cf1e577e6d.png`

These pages are faithful screenshot recreations, not redesigns. The implementation uses React and TypeScript with shared site components.

- Routes in scope: `/` and `/about`
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

## 6. Reusable React primitives and states

- `SiteHeader`: utility bar, brand, desktop nav, accessible mobile disclosure, active route state.
- `SiteFooter`: reusable brand, quick links, services, confirmed phone contacts, and legal strip.
- `ButtonLink`: primary, outline, and light variants with hover, active, focus-visible, and reduced-motion behavior.
- `SectionEyebrow`: compact orange section label, used only where the reference includes one.
- `Icon`: one Phosphor icon family with consistent weight.
- `ReferencePhoto`: fixed-ratio clipped media frame for approved imagery embedded in a reference composite.
- `Home`: the preserved homepage at `/`.
- `About`: the approved About page at `/about`.

## 7. Motion

- The About mockup does not specify decorative animation, so it remains static apart from interaction feedback and mobile-menu state.
- The preserved homepage may retain its restrained hero hierarchy and in-view reveals.
- Only transforms and opacity animate.
- All automatic motion honors `prefers-reduced-motion`; menu state changes remain immediate and usable.

## 8. Accessibility and content constraints

- One `h1` per route, coherent heading order, semantic landmarks, a skip link, native links and buttons.
- On SPA route changes, update the document title, scroll to the top, and focus the route heading.
- Visible 2px focus ring, 44px touch targets, descriptive image alternatives, and decorative imagery hidden from assistive technology.
- About is marked with `aria-current="page"` on `/about`; Home is current only on `/`.
- Do not invent services, claims, certifications, statistics, testimonials, employees, projects, addresses, hours, or email addresses.
- Confirmed phone destinations are Thabang at 084 035 6925 and Pontsho at 064 367 0274.
- Since no quote/contact React route exists yet, quote CTAs use the confirmed Thabang phone destination and this limitation is reported.
