# Cloudflare production deployment

Gauvis now deploys as one Cloudflare Worker: Static Assets serve the Vite React application and the Worker handles the existing `/api/*` Express routes on the same origin. MongoDB Atlas and Resend remain external services. The old `render.yaml` is retained only as a rollback reference; do not shut down the live Render service until the Cloudflare checks below pass and the owner explicitly approves it.

## Required external verification before production cutover

1. In Resend, verify that `guavistech.com` is an authenticated sending domain and that `notification@guavistech.com` is permitted as a sender.
2. Confirm with the business owner that the company inbox is intentionally `info@gauvistech.com` (note the different domain spelling from the sender) before setting `COMPANY_NOTIFICATION_EMAIL`.
3. Send a real staging enquiry and confirm both the company notification and customer confirmation in their destination inboxes; local mocked tests do not prove delivery.
4. In Google Search Console, add and verify the `https://gauvistech.com/` property, submit `https://gauvistech.com/sitemap.xml`, inspect the home, services, and contact URLs, then request indexing. Submission does not guarantee indexing.

## Before deployment

1. Use Node 24 LTS and run `npm ci`.
2. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run check:worker`.
3. In Cloudflare, create the Worker through the dashboard or authenticate Wrangler using `npx wrangler login`.
4. Configure the Worker secrets. Never enter these as `VITE_*` variables or commit them:

```powershell
npx wrangler secret put MONGODB_URI
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put JWT_SECRET_KEY
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put RATE_LIMIT_KEY_SECRET
npx wrangler secret put ADMIN_USERNAME
```

The non-secret Worker defaults are declared in `wrangler.jsonc` and are the source of truth for GitHub/Wrangler deployments. Change them there and redeploy; do not rely on dashboard-only overrides that a later Wrangler deployment may replace:

| Name | Production value |
| --- | --- |
| `ENABLE_ENQUIRIES` | `false` by default; change to `true` only after legal approval |
| `MONGODB_DB_NAME` | `gauvistech` |
| `MONGODB_COLLECTION` | `enquiries` |
| `RESEND_FROM_EMAIL` | Address on Resend-verified sending domain |
| `ADMIN_EMAIL` | Gauvis recipient inbox |
| `ADMIN_LOGIN_NOTIFICATION_COOLDOWN_SECONDS` | `900` unless a different 1–86,400-second cooldown is required |

`RATE_LIMIT_KEY_SECRET` must be a new random secret, separate from the JWT secret. The Worker HMACs client addresses before placing short-lived limits in its Durable Object; it never stores raw visitor IPs as limiter keys.

Set `VITE_ENABLE_ENQUIRIES` as a **Cloudflare build environment variable** to `true` only after legal approval; it is embedded in the public frontend bundle. It is independent of the runtime `ENABLE_ENQUIRIES` Worker variable, so both must be enabled for submissions. Keep `VITE_API_BASE_URL` unset so the app uses same-origin `/api` requests.

## Build and deploy

The exact commands are:

```powershell
npm ci
npm run build
npx wrangler deploy
```

Or use `npm run deploy:cloudflare`. GitHub/Cloudflare build settings are **Build command** `npm ci && npm run build` and **Deploy command** `npx wrangler deploy`; repository root is this project root. Do not set `VITE_API_BASE_URL` in the Cloudflare build environment: an omitted value deliberately makes frontend requests same-origin, for example `https://gauvistech.com/api/admin/login`.

For GitHub deployments, connect this repository in **Workers & Pages > Create application > Import a repository**, use the repository root as the working directory, `npm ci && npm run build` as the build command, and `npx wrangler deploy` as the deploy command. Add the public build variable `VITE_ENABLE_ENQUIRIES` there. The checked-in `wrangler.jsonc` sets the Worker entry point, Node.js compatibility, Worker Static Assets from `dist/`, SPA fallback, `/api/*` Worker-first routing, durable-object migration, non-secret runtime defaults, and required secret names. Run `npm run typecheck` after changing Wrangler configuration; it regenerates local Worker runtime types.

## MongoDB Atlas and Resend

Use the existing Atlas cluster and put only its application connection string in `MONGODB_URI`. The existing repository validates/updates the collection schema and indexes, so the database user needs `readWrite` plus the least additional database-scoped permissions needed for collection validation/index updates. Cloudflare documents that Worker TCP egress does not use the published Cloudflare edge IP ranges; this project does not configure a fixed egress IP. Before cutover, verify Atlas connectivity using a network policy that your security team approves. Do not add `0.0.0.0/0` or another broad allowlist as an automatic workaround. If Atlas cannot safely allow Worker egress, use a supported private connectivity path (for example Workers VPC with an approved tunnel/network design) or keep the existing API service until that path is provisioned. MongoDB has not been tested against the live Atlas cluster from this workspace.

The existing `scrypt` password verification runs on the Worker during login and may exceed the Workers Free plan's 10 ms CPU budget. Measure it on the target plan; use a paid plan if necessary, and do not weaken password hashing to fit a plan limit.

In Resend, verify the sender domain first, then set `RESEND_FROM_EMAIL` to a sender on that domain. Store a sending-only, domain-restricted API key as `RESEND_API_KEY`. A saved enquiry attempts a team notification and customer receipt; a notification failure does not discard its MongoDB record. Successful admin login alerts go only to `ADMIN_EMAIL` and use the durable-object cooldown. Passwords, tokens, cookie values, and provider error details are never emailed or logged.

## Domain cutover without disrupting email

In Cloudflare Workers & Pages, attach `gauvistech.com` as a **Custom Domain** to this Worker after the zone is active in Cloudflare. Do not replace or delete existing MX, SPF, DKIM, or DMARC records. Adding the Worker domain changes the web `A`/`AAAA` or proxied hostname routing only; preserve all mail records exactly as they are. Confirm HTTPS and open `/`, `/contact`, `/services/hardware-support`, `/admin/login`, and `/admin/enquiries` after DNS propagates.

## Production smoke test and rollback

1. Confirm `GET /api/health` returns `{"status":"ok"}` on the same public hostname.
2. Submit one labelled test enquiry. Confirm one Atlas record, a team email, and customer receipt.
3. Sign in at `/admin/login`, confirm the dashboard can list the test record, refresh, then log out. Confirm one login alert; failed sign-ins must not alert.
4. Verify browser requests use `/api/...`, have no Render hostname, need no CORS response headers, and the session cookie is `HttpOnly; Secure; SameSite=Strict; Path=/api/admin`.
5. Send more than five test login attempts or enquiry attempts from one address within 15 minutes and confirm `429`; use a non-production test environment for this check.

If a Cloudflare regression occurs, restore the previous Cloudflare Worker deployment or point the frontend back to the retained Render API by setting a validated HTTPS `VITE_API_BASE_URL` and rebuilding. Keep Render running throughout this period. Only after all checks pass in production, a rollback period has elapsed, MongoDB/Resend work from the Worker, and the owner gives explicit approval should you disable the Render service and then remove `render.yaml`.
