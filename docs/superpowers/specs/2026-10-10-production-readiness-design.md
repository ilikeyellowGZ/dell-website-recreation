# Production Readiness Design

## Objective

Prepare the Gauvis Technology website for production by improving mobile loading performance, replacing placeholder/cropped imagery with the supplied high-resolution library, validating the existing MongoDB setup, adding a secure enquiry administration area, and making reverse-proxy behavior explicit.

## Confirmed Scope

- Use the images in `public/GauvisTech_individual_images/` in their named page and section contexts.
- Add a protected `/admin` interface for staff to sign in and view enquiries.
- Generate local admin credentials and a JWT signing secret in the ignored `.env` file. No secret or plaintext password may be committed.
- Use the MongoDB configuration already present in `.env` and run `npm run db:setup`.
- Split the 4,000-line global stylesheet and lazy-load route-specific React, Motion, GSAP, and CSS code.
- Support reverse proxies through explicit environment configuration rather than trusting forwarded headers by default.
- Skip canonical URL, sitemap URL, Open Graph URL, privacy-policy, and terms work until the owner supplies and approves those production details.
- Disable public enquiry submission in production by default until approved privacy and terms content exists. Local development may enable it explicitly.

## Frontend Architecture

`src/main.tsx` will load only the global reset, tokens, typography, layout shell, header, footer, buttons, and accessibility styles. Each page module will import its own stylesheet. Because pages are loaded with `React.lazy`, Vite will emit matching JavaScript and CSS chunks and fetch them only when a route is visited.

The app shell will not import Motion or GSAP. Route changes will use a small CSS transition that respects `prefers-reduced-motion`. The Home page will remain the only page allowed to load GSAP and Motion, because it uses entrance and scroll-reveal animation. This keeps those packages out of non-home initial routes and out of the global application chunk.

All routes will retain the existing header, footer, skip link, focus restoration, hash scrolling, and fallback behavior. An accessible loading fallback will be shown while a route chunk loads.

## Image Architecture

Every supplied photograph is named for its intended route and section. Those names are the source of truth:

- About: hero, story, on-site support, and CTA.
- Services: hero, eight service cards, and CTA.
- Solutions: hero and approach.
- Case studies: hero, four cases, and process.
- Contact: hero.
- FAQ: hero and CTA.
- Brand logos: individual ecosystem logos, preferring SVG versions where supplied.

The source PNG photographs are 1536×1024 and roughly 1.1–2.1 MB each. Production derivatives will be generated as responsive WebP files at practical display widths while preserving the original files. Page markup will use `srcSet`, `sizes`, intrinsic dimensions, meaningful alternative text, eager loading only for the current page’s largest-contentful image, and lazy loading elsewhere. Images used only as decoration will have empty alternative text.

The existing composite screenshot crops and low-resolution 255-pixel assets will no longer be used where a named high-resolution replacement exists.

## Enquiry Availability

The public form will read a build-time availability flag and the API will enforce a server-side availability flag. The production default is disabled. A disabled form will clearly explain that online enquiries are temporarily unavailable and will retain phone and WhatsApp alternatives.

Enabling only the browser flag will not bypass the server check. Public submission becomes available only after the owner adds approved legal pages and explicitly enables both deployment variables.

## Admin Authentication

The admin surface consists of `/admin/login` and `/admin/enquiries`. There is no registration, password reset, or role-management interface.

Authentication uses:

- One deployment-configured admin username.
- A generated high-entropy password whose scrypt hash is stored in `.env`.
- A generated 256-bit JWT secret stored in `.env`.
- A short-lived signed JWT stored in an `HttpOnly`, `SameSite=Strict` cookie. The cookie is `Secure` in production.
- Constant-time password-hash comparison.
- Login rate limiting and generic failure messages.
- Origin validation for state-changing admin requests.
- Server-side authorization on every protected API request.

The plaintext generated password will be displayed once in the final handoff and will not be written to tracked files. The login URL for local production preview will be reported after verification; the public URL will be `https://gauvistech.com/admin/login` only after that domain is deployed and DNS is controlled by the owner.

## Admin Data Flow

`POST /api/admin/login` validates credentials and sets the session cookie. `GET /api/admin/enquiries` validates the cookie and returns a bounded, newest-first enquiry list containing only fields required by the dashboard. `POST /api/admin/logout` clears the cookie.

The MongoDB repository interface will gain a bounded list operation in addition to insertion. Database queries will use a fixed sort and server-controlled limit. The dashboard will represent loading, empty, authentication-expired, and service-unavailable states without leaking database or authentication internals.

## Reverse Proxy Handling

Express will not trust proxy headers by default. A `TRUST_PROXY` environment value will support an explicit hop count or a vetted Express trust-proxy value. Deployment documentation will explain that a single managed reverse proxy normally uses `TRUST_PROXY=1`; direct deployments leave it unset. Rate limiting will therefore use the real client address only when the deployment topology opts in.

Invalid trust-proxy configuration will fail closed during startup rather than silently trusting arbitrary forwarding headers.

## MongoDB Setup

The existing `MONGODB_URI`, `MONGODB_DB_NAME`, and `MONGODB_COLLECTION` values will be consumed without printing them. `npm run db:setup` will create or update the collection validator and indexes. Its output may report database, collection, and index names but must never include the connection URI or password.

## Security and Error Handling

- Secrets remain in ignored environment files and are never returned by APIs.
- Helmet and the existing restrictive content security policy remain enabled.
- JSON bodies remain size-limited and validated at API boundaries.
- Enquiry and login endpoints have separate rate limits.
- Admin responses use `Cache-Control: no-store`.
- Authentication errors are indistinguishable to clients.
- MongoDB errors return generic service-unavailable responses and are not exposed to the browser.
- Production cookies require HTTPS.
- Public enquiry storage remains unavailable until explicitly enabled.

## Testing and Acceptance

Implementation follows red-green-refactor. Automated tests will cover:

- Route lazy-loading behavior and loading fallbacks.
- Enquiry availability in both enabled and disabled modes.
- JWT creation, verification, expiry, cookie flags, login failure, logout, and protected-route rejection.
- Admin enquiry listing, limits, newest-first order, and database failure responses.
- Trusted-proxy parsing and application behavior.
- Image mappings, responsive attributes, and removal of obsolete composite references.

Final verification will run the complete unit test suite, TypeScript typecheck, ESLint, React Doctor, production build, dependency audit, MongoDB setup, and browser checks at mobile and desktop widths. The production bundle will be inspected to confirm route-level JavaScript and CSS chunks and that Motion/GSAP are not global dependencies.

## Deferred Work

The following are intentionally excluded until the owner supplies the required approved details:

- Canonical URLs, absolute sitemap URLs, Open Graph URLs, and production-domain redirects.
- Privacy-policy and terms copy.
- Enabling production enquiry submission.
- DNS, TLS, hosting-provider, and reverse-proxy deployment changes outside this repository.
