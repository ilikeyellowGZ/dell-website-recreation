# Production deployment

Cloudflare serves the static frontend at `https://gauvistech.com`. The existing API at `https://guavis.onrender.com` stores enquiries in MongoDB Atlas before asking Resend to notify the team. Keep backend secrets in a password manager and the API host's environment settings; never expose them to the frontend build.

## 1. Prepare the release

Use the reviewed commit and Node.js 24 LTS with `npm ci`. Confirm approved privacy/terms content is published before enabling public collection. Keep `ENABLE_ENQUIRIES=false` on the existing API service until that prerequisite is met, and build with `VITE_ENABLE_ENQUIRIES=false` meanwhile.

Use `https://gauvistech.com` as the canonical website origin. If `www.gauvistech.com` also serves the site, allow it explicitly in the API's `FRONTEND_ORIGIN`; redirecting to one canonical host reduces configuration. Configure `gauvistech.com` as the Cloudflare Worker custom domain and ensure HTTPS is enabled.

Run `npm run admin:credentials` on a trusted local machine. It writes `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET_KEY` into local `.env`, prints a one-time password, and resets both local enquiry flags to `false`. Save the password privately. Copy the username/hash to Render privately; keep Render's generated JWT secret for production. Never paste these credentials into tickets, repository files, or frontend variables.

## 2. Configure MongoDB Atlas

Create the production cluster and a dedicated password-authenticated database user restricted to that cluster and database `gauvistech`. This code creates/checks the collection, runs `collMod`, and creates indexes on first access, so a read/write-only user is insufficient. Give this application user `readWrite` plus `dbAdmin`, scoped to `gauvistech`, or a custom role containing the required schema/index operations. Do not grant cluster-wide administrator privileges. See [Atlas database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/).

Copy Atlas's application connection URI, URL-encode its username/password components, and privately set `MONGODB_URI`. Use `MONGODB_DB_NAME=gauvistech` and `MONGODB_COLLECTION=enquiries` consistently. Allow the operator's temporary public IP for setup. Run `npm run db:setup` with these values in local `.env`; verify the `createdAt_desc` and `status_createdAt_desc` indexes. Remove the temporary IP when finished.

Copy **every outbound CIDR** under the existing Render service's **Connect > Outbound** tab into Atlas Network Access before testing storage. Use its actual region/ranges, rather than the inbound address; avoid a blanket `0.0.0.0/0` rule. [Render outbound IP guidance](https://render.com/docs/outbound-ip-addresses) explains shared ranges and dedicated outbound IPs.

## 3. Verify Resend DNS and restrict the key

In Resend, add a dedicated sending subdomain such as `notifications.example.com`. Copy the exact DNS record types, names, priorities, and values Resend supplies into the **authoritative DNS provider**. Watch for panels that append the zone name automatically. Preserve existing mailbox MX/SPF records; publish sending records at Resend's requested names and do not enable inbound receiving for this workflow. Wait for propagation and Resend's verified status before sending. See [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction).

Create an application-specific key with **Sending access**, restricted to that verified subdomain, and save its value privately as `RESEND_API_KEY`. Use `RESEND_FROM_EMAIL=enquiries@notifications.example.com` as an example only; configure a sender at the subdomain you verified. Replace the example `ADMIN_EMAIL=team@example.com` with your real team mailbox before expecting to receive alerts. After an enquiry is stored, the team receives its details with the submitter as `replyTo`, and the customer receives a branded confirmation with the team mailbox as `replyTo`. A successful admin sign-in also sends a branded team security alert containing the account identifier and UTC timestamp; credentials are never emailed. Login alerts are limited to one per 15 minutes by default (`ADMIN_LOGIN_NOTIFICATION_COOLDOWN_SECONDS` can be set from 1 to 86,400). Both branded messages embed the existing Gauvis Tech logo as an inline image and include text-only versions; the detailed team enquiry email stays unchanged. `RESEND_TO_EMAIL` is supported only as a temporary migration fallback when `ADMIN_EMAIL` is absent. See [Resend key permissions](https://resend.com/docs/api-reference/api-keys/create-api-key) and [domain restrictions in the API keys dashboard](https://resend.com/docs/dashboard/api-keys/introduction).

## 4. Keep the existing API connected

The frontend continues to call the existing API origin `https://guavis.onrender.com`; this project no longer includes a Render Blueprint or provisions another API service. Keep the API's runtime configuration and secrets on that existing service. Its `FRONTEND_ORIGIN` must include `https://gauvistech.com`, and `GET /api/health` must return JSON `{"status":"ok"}`.

To sign in on the current Cloudflare preview, add its exact origin to the existing API service's `FRONTEND_ORIGIN`, then redeploy/restart that API service:

```text
https://gauvistech.com,https://dell-website-recreation.service-heyywebb.workers.dev
```

Origins are comma-separated, exact HTTPS origins with no path or trailing slash. Keep the canonical website origin in the list, and remove the temporary `workers.dev` origin when preview testing ends. Do not use wildcard origins. The browser's `VITE_API_BASE_URL` remains the API origin, `https://guavis.onrender.com`.

| Existing API runtime variable | Value or source |
| --- | --- |
| `NODE_ENV` | `production` |
| `ENABLE_ENQUIRIES` | `true`; hold at `false` until legal approval |
| `SERVE_FRONTEND` | `false`; keeps the API-only service from serving a cached `dist` folder |
| `TRUST_PROXY` | `1` trusted proxy hop |
| `FRONTEND_ORIGIN` | `https://gauvistech.com`; add the exact Cloudflare preview origin temporarily when testing on `workers.dev` |
| `MONGODB_URI` | Private Atlas connection URI |
| `MONGODB_DB_NAME` | `gauvistech` |
| `MONGODB_COLLECTION` | `enquiries` |
| `RESEND_API_KEY` | Private sending-only, domain-restricted key |
| `RESEND_FROM_EMAIL` | Sender at the verified subdomain |
| `ADMIN_EMAIL` | Team recipient mailbox for enquiry and successful-login alerts; replace `team@example.com` placeholder |
| `ADMIN_LOGIN_NOTIFICATION_COOLDOWN_SECONDS` | `900` by default; minimum interval between successful-login alerts per running API instance |
| `ADMIN_USERNAME` | Locally generated/chosen username |
| `ADMIN_PASSWORD_HASH` | Generated `scrypt$...` hash; paste whole value without shell expansion |
| `JWT_SECRET_KEY` | Secret generated for the API host; keep stable across normal deploys |

`FRONTEND_ORIGIN` accepts no wildcard, credentials, non-root path, query, fragment, or HTTP origin in production; invalid/missing values stop startup. `VITE_*` values are unnecessary on the API host. Complete the Atlas outbound allowlist from step 2, then open `https://guavis.onrender.com/api/health`. Confirm the response has JSON content and is exactly `{"status":"ok"}`. The API host root (`/`) may return `404`; Cloudflare serves the website. A health response proves HTTP responsiveness, **not** storage or email delivery.

Review startup logs for missing storage, notification, or admin configuration. Email failure logs contain only `Enquiry notification failed after storage.` and a category. Do not enable request-body, credential, cookie, or provider-error logging. Missing notification configuration permits storage but requires the dashboard as the recovery path.

## 5. Build and deploy the frontend to Cloudflare

The production API origin is preconfigured in `.env.production`. Cloudflare's build environment can set `VITE_API_BASE_URL` to override it. It must be an absolute HTTPS origin with no credentials, path, query, or fragment. Both values below are public build inputs; changing them requires rebuilding:

| Frontend build variable | Production value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://guavis.onrender.com` |
| `VITE_ENABLE_ENQUIRIES` | `true` after legal approval |

Configure the Cloudflare Worker build with `npm ci` followed by `npm run build`, and deploy the generated `dist/` directory using `wrangler.jsonc`. Set `VITE_API_BASE_URL=https://guavis.onrender.com` and `VITE_ENABLE_ENQUIRIES=true` in Cloudflare's production build variables after legal approval. Bind the custom domain `gauvistech.com` to the Worker. The Vite build fails closed if the API URL is missing or invalid.

Only `VITE_*` values are public and embedded into the JavaScript bundle. Never configure `RESEND_API_KEY`, MongoDB credentials, `ADMIN_PASSWORD_HASH`, or `JWT_SECRET_KEY` in Cloudflare's frontend build environment.

## 6. Verify locally and after launch

The full local gate uses a representative HTTPS API URL and disabled form for the existing baseline browser checks. In PowerShell:

```powershell
$env:VITE_API_BASE_URL = 'https://guavis.onrender.com'
$env:VITE_ENABLE_ENQUIRIES = 'false'
npm test
npm run typecheck
npm run lint
npm run build
npm run doctor
```

Install Python Playwright with `python -m pip install playwright` and use Microsoft Edge (default), or `python -m playwright install chromium` with `$env:BROWSER_CHANNEL='chromium'`. In a separate terminal start `npm run preview`, then run:

```powershell
python tests/site.browser.py
python tests/dashboard.browser.py
```

`BASE_URL` overrides the baseline preview origin (`http://127.0.0.1:4173`). The harness preserves the disabled-form/responsive journeys and starts isolated loopback Vite/API servers with enabled enquiries, an in-memory repository, and a recording notifier. It exercises allowed contact POST/preflight and rejected origins without MongoDB or Resend. `SPLIT_API_BASE_URL=http://127.0.0.1:<unused-port>` optionally selects the fixture's local API port; it never targets a deployed API. The local split uses HTTP and does not prove production HTTPS cookies or third-party-cookie browser policy. Rebuild/package with `VITE_ENABLE_ENQUIRIES=true` before uploading the production release.

After deployment, complete all launch checks:

1. Directly open and refresh `/contact`, `/services/hardware-support`, `/admin/login`, and `/admin/enquiries`. Confirm SPA routing, loaded assets, HTTPS redirects, and no unexpected browser errors. Check that HTML revalidates and real fingerprinted `/assets` responses cache immutably.
2. Submit one clearly identified test enquiry. In browser Network tools confirm POST targets the configured API `/api/enquiries`, carries the exact website `Origin`, returns `201 { accepted: true }`, and includes the precise CORS origin, credentials permission, and `Vary: Origin`. Verify one matching MongoDB record, one team notification, and one customer receipt. Reply to the team notification and check that the reply targets the submitter.
3. Sign in at `/admin/login`, confirm `/admin/enquiries` lists the record, refresh, and sign out. Verify one successful-login alert arrived at the team mailbox; an incorrect-password attempt must not generate one. Subsequent session/list requests must be unauthenticated. Inspect the API-host cookie: `HttpOnly; Secure; SameSite=None; Path=/api/admin`, 15-minute lifetime. All frontend admin calls include credentials. If browser privacy policy blocks cross-site cookies, test a same-site custom API domain and update/rebuild the configured origins; cookie attributes cannot override browser policy.
4. Test preflight and direct state-changing rejection (replace the example host):

   ```sh
   curl -i -X OPTIONS https://guavis.onrender.com/api/enquiries -H 'Origin: https://unapproved.example' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'
   curl -i -X POST https://guavis.onrender.com/api/enquiries -H 'Origin: https://unapproved.example' -H 'Content-Type: application/json' --data '{}'
   ```

   Both return 403 without `Access-Control-Allow-Origin`; an absent-Origin production POST must also return 403. There must be no insert/email. Non-browser callers can forge Origin headers; existing rate limits still apply.
5. Confirm a storage outage produces generic 503 without email. Test notification-failure recovery in staging: storage stays accepted, a sanitized warning appears, and the record is in the dashboard. The team notification and customer receipt are attempted independently, so one may arrive even if the other fails. A login-alert failure must not reject an otherwise valid sign-in. There is no automatic retry/resend queue; do not resubmit an accepted enquiry to recover an email. Check Resend delivery events/spam separately from API acceptance.

## 7. Rollback and rotation

For frontend regression, restore the prior Cloudflare deployment and retain assets needed by open tabs. For API regression, redeploy the last reviewed API version and verify environment settings, health, enquiry flow, and admin session. Roll back API/frontend as a compatible pair if their contract changed. Never restore compromised credentials or delete stored enquiries. To pause collection, set `ENABLE_ENQUIRIES=false` on the API host, redeploy it, and rebuild/redeploy with `VITE_ENABLE_ENQUIRIES=false` so visitors see the phone/WhatsApp fallback.

Rotate using replacement-first procedures unless compromise requires immediate revocation:

- **Resend:** create a new sending-only key restricted to the verified domain, update `RESEND_API_KEY` on Render, redeploy, verify notification, then revoke the old key. A sender-domain change also requires DNS verification and `RESEND_FROM_EMAIL` update.
- **MongoDB:** create a replacement database user with the same scoped permissions, update Render's `MONGODB_URI`, redeploy, verify insert/admin listing, then revoke the old user. Update private local setup credentials too.
- **Admin:** run `npm run admin:credentials` on a trusted local copy, save the new password, and privately transfer username/hash to Render. The command also changes the local JWT and resets both local enquiry flags to `false`; restore desired flags before rebuilding. Changing the password hash does **not** revoke existing sessions: also rotate Render's JWT when revocation is required.
- **JWT:** generate a fresh 32-byte base64url secret (the credential generator supplies one), privately update `JWT_SECRET_KEY` on Render, and redeploy. Existing sessions must sign in again; verify login/list/logout. Keep the production JWT stable on routine deploys.

Backend secret changes require a Render restart/deploy, not a frontend upload. A changed API hostname or frontend flag requires a rebuild/upload; a changed website hostname also requires updating Render's exact `FRONTEND_ORIGIN` allowlist. Record the release commit, test results, and rotation time without secret values.
