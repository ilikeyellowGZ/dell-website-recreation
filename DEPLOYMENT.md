# Production deployment

DirectAdmin serves the static frontend. Render runs the Express API, which stores enquiries in MongoDB Atlas before asking Resend to notify the team. All example domains and credentials below are placeholders. Keep real secrets in a password manager and Render's environment settings.

## 1. Prepare the release

Use the reviewed commit and Node.js 24 LTS with `npm ci`. Confirm approved privacy/terms content is published before enabling public collection. The Blueprint sets `ENABLE_ENQUIRIES=true`; override it to `false` in Render while that prerequisite is pending and build with `VITE_ENABLE_ENQUIRIES=false`.

Choose the final HTTPS website origin, for example `https://example.com`. If both apex and `www` serve the site, allow both explicitly; redirecting to one canonical host reduces configuration. Obtain access to the authoritative DNS provider and an HTTPS-capable DirectAdmin account using Apache 2.4 with `.htaccess` overrides and `mod_rewrite`. Confirm `mod_headers` is enabled for cache/security headers. A host using Nginx without Apache compatibility needs equivalent host-managed routing and headers before launch.

Run `npm run admin:credentials` on a trusted local machine. It writes `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET_KEY` into local `.env`, prints a one-time password, and resets both local enquiry flags to `false`. Save the password privately. Copy the username/hash to Render privately; keep Render's generated JWT secret for production. Never paste these credentials into tickets, repository files, or frontend variables.

## 2. Configure MongoDB Atlas

Create the production cluster and a dedicated password-authenticated database user restricted to that cluster and database `gauvistech`. This code creates/checks the collection, runs `collMod`, and creates indexes on first access, so a read/write-only user is insufficient. Give this application user `readWrite` plus `dbAdmin`, scoped to `gauvistech`, or a custom role containing the required schema/index operations. Do not grant cluster-wide administrator privileges. See [Atlas database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/).

Copy Atlas's application connection URI, URL-encode its username/password components, and privately set `MONGODB_URI`. Use `MONGODB_DB_NAME=gauvistech` and `MONGODB_COLLECTION=enquiries` consistently. Allow the operator's temporary public IP for setup. Run `npm run db:setup` with these values in local `.env`; verify the `createdAt_desc` and `status_createdAt_desc` indexes. Remove the temporary IP when finished.

After creating Render's service in step 4, copy **every outbound CIDR** under its **Connect > Outbound** tab into Atlas Network Access before testing storage. Use its actual region/ranges, rather than the inbound address; avoid a blanket `0.0.0.0/0` rule. [Render outbound IP guidance](https://render.com/docs/outbound-ip-addresses) explains shared ranges and dedicated outbound IPs.

## 3. Verify Resend DNS and restrict the key

In Resend, add a dedicated sending subdomain such as `notifications.example.com`. Copy the exact DNS record types, names, priorities, and values Resend supplies into the **authoritative DNS provider**. DirectAdmin's DNS panel applies only if the domain is delegated there. Watch for panels that append the zone name automatically. Preserve existing mailbox MX/SPF records; publish sending records at Resend's requested names and do not enable inbound receiving for this workflow. Wait for propagation and Resend's verified status before sending. See [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction).

Create an application-specific key with **Sending access**, restricted to that verified subdomain, and save its value privately as `RESEND_API_KEY`. Use `RESEND_FROM_EMAIL=enquiries@notifications.example.com` and the real team mailbox for `RESEND_TO_EMAIL`. The submitter becomes `replyTo`, never the sender; no customer confirmation is sent. See [Resend key permissions](https://resend.com/docs/api-reference/api-keys/create-api-key) and [domain restrictions in the API keys dashboard](https://resend.com/docs/dashboard/api-keys/introduction).

## 4. Deploy the API with the Render Blueprint

Connect the repository to Render, select **New > Blueprint**, choose the reviewed branch and root `render.yaml`, and review the service settings and plan. The Blueprint uses `buildCommand: npm ci`, `startCommand: npm start`, and `healthCheckPath: /api/health`. Render supplies `PORT`; do not hardcode it. Use Node.js 24 LTS. The API does not require or serve a frontend build in production. See [Render Blueprints](https://render.com/docs/infrastructure-as-code) and [Blueprint settings](https://render.com/docs/blueprint-spec).

For the existing **Guavis** service at `https://guavis.onrender.com`, update that service directly instead of creating a second Blueprint service: select the branch containing these changes, use `npm ci` as the build command and `npm start` as the start command, and set `FRONTEND_ORIGIN=https://gauvistech.com`, `NODE_ENV=production`, `SERVE_FRONTEND=false`, and `TRUST_PROXY=1` in its Environment settings. Deploy the latest commit from that branch. The current live `/api/health` must return JSON, not the frontend HTML.

Enter **every** `sync: false` value below at creation. The Blueprint sets `FRONTEND_ORIGIN=https://gauvistech.com`; if you created the Render service manually, enter that exact value in its Environment settings. Later rotations belong in the service's Environment settings, followed by a deploy/restart.

| Render runtime variable | Value or source |
| --- | --- |
| `NODE_ENV` | Blueprint: `production` |
| `ENABLE_ENQUIRIES` | Blueprint: `true`; hold at `false` until legal approval |
| `SERVE_FRONTEND` | Blueprint: `false`; keeps Render API-only even if a cached `dist` folder exists |
| `TRUST_PROXY` | Blueprint: `1` trusted Render proxy hop |
| `FRONTEND_ORIGIN` | Blueprint: `https://gauvistech.com`; add `https://www.gauvistech.com` only if the live website actually uses it |
| `MONGODB_URI` | Private Atlas connection URI |
| `MONGODB_DB_NAME` | `gauvistech` |
| `MONGODB_COLLECTION` | `enquiries` |
| `RESEND_API_KEY` | Private sending-only, domain-restricted key |
| `RESEND_FROM_EMAIL` | Sender at the verified subdomain |
| `RESEND_TO_EMAIL` | Team recipient mailbox |
| `ADMIN_USERNAME` | Locally generated/chosen username |
| `ADMIN_PASSWORD_HASH` | Generated `scrypt$...` hash; paste whole value without shell expansion |
| `JWT_SECRET_KEY` | Blueprint-generated secret; keep stable across normal deploys |

`FRONTEND_ORIGIN` accepts no wildcard, credentials, non-root path, query, fragment, or HTTP origin in production; invalid/missing values stop startup. `VITE_*` values are unnecessary on Render. Complete the Atlas outbound allowlist from step 2, deploy, then open `https://guavis.onrender.com/api/health`. Confirm the response has JSON content and is exactly `{"status":"ok"}`; an HTML page with HTTP 200 means the wrong deployment is running. Opening the Render host root (`/`) should return `404`; that is intentional because DirectAdmin serves the website. This proves HTTP responsiveness, **not** storage or email delivery.

Review startup logs for missing storage, notification, or admin configuration. Email failure logs contain only `Enquiry notification failed after storage.` and a category. Do not enable request-body, credential, cookie, or provider-error logging. Missing notification configuration permits storage but requires the dashboard as the recovery path.

## 5. Build and upload the frontend

Use the actual Render HTTPS origin with no `/api` suffix or other path. Both values below are public build inputs; changing them requires rebuilding:

| Frontend build variable | Production value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<actual-service-host>` |
| `VITE_ENABLE_ENQUIRIES` | `true` after legal approval |

PowerShell:

```powershell
$env:VITE_API_BASE_URL = 'https://guavis.onrender.com'
$env:VITE_ENABLE_ENQUIRIES = 'true'
npm run package:directadmin
Get-ChildItem -Force -Recurse release/directadmin
```

POSIX shell:

```sh
VITE_API_BASE_URL=https://guavis.onrender.com VITE_ENABLE_ENQUIRIES=true npm run package:directadmin
find release/directadmin -type f
```

Packaging runs `npm run build`, rejects an absent/invalid/insecure API origin, recreates only `release/directadmin`, and copies built files plus `deploy/directadmin/.htaccess`. Inspect for `index.html`, fingerprinted `assets/`, fonts/images, and `.htaccess`; there must be no `.env`, source maps, backend source, tests, package metadata, or credentials. Only the two public frontend variables should be deliberately exposed with `VITE_` names. Keep the prior static release as a private backup.

Enable the domain's HTTPS certificate in DirectAdmin and redirect HTTP to HTTPS. Upload the **contents** of `release/directadmin` to the correct domain's `public_html`, including hidden `.htaccess`; do not upload the containing folder. Preserve unrelated host-managed files such as certificate validation files. Upload new hashed assets first and `index.html` last to reduce mixed-version loads. Keep prior hashed assets through the rollback window. Never upload `.env`, `RESEND_API_KEY`, MongoDB credentials, `ADMIN_PASSWORD_HASH`, `JWT_SECRET_KEY`, or repository/server files.

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

After upload, complete all launch checks:

1. Directly open and refresh `/contact`, `/services/hardware-support`, `/admin/login`, and `/admin/enquiries`. Confirm SPA routing, loaded assets, HTTPS redirects, and no unexpected browser errors. Check that HTML revalidates and real fingerprinted `/assets` responses cache immutably.
2. Submit one clearly identified test enquiry. In browser Network tools confirm POST targets Render `/api/enquiries`, carries the exact website `Origin`, returns `201 { accepted: true }`, and includes the precise CORS origin, credentials permission, and `Vary: Origin`. Verify one matching MongoDB record and a single team notification. Reply and check the reply targets the submitter.
3. Sign in at `/admin/login`, confirm `/admin/enquiries` lists the record, refresh, and sign out. Subsequent session/list requests must be unauthenticated. Inspect the API-host cookie: `HttpOnly; Secure; SameSite=None; Path=/api/admin`, 15-minute lifetime. All frontend admin calls include credentials. If browser privacy policy blocks cross-site cookies, test a same-site custom API domain and update/rebuild the configured origins; cookie attributes cannot override browser policy.
4. Test preflight and direct state-changing rejection (replace the example host):

   ```sh
   curl -i -X OPTIONS https://guavis.onrender.com/api/enquiries -H 'Origin: https://unapproved.example' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'
   curl -i -X POST https://guavis.onrender.com/api/enquiries -H 'Origin: https://unapproved.example' -H 'Content-Type: application/json' --data '{}'
   ```

   Both return 403 without `Access-Control-Allow-Origin`; an absent-Origin production POST must also return 403. There must be no insert/email. Non-browser callers can forge Origin headers; existing rate limits still apply.
5. Confirm a storage outage produces generic 503 without email. Test notification-failure recovery in staging: storage stays accepted, a sanitized warning appears, and the record is in the dashboard. There is no automatic retry/resend queue; do not resubmit an accepted enquiry to recover an email. Check Resend delivery events/spam separately from API acceptance.

## 7. Rollback and rotation

For frontend regression, restore the prior `index.html`, `.htaccess`, and matching assets from the private release backup. Retain assets needed by open tabs. For API regression, redeploy the last reviewed Render commit/image and verify environment settings, health, enquiry flow, and admin session. Roll back API/frontend as a compatible pair if their contract changed. Never restore compromised credentials or delete stored enquiries. To pause collection, set `ENABLE_ENQUIRIES=false`, redeploy Render, and rebuild/upload with `VITE_ENABLE_ENQUIRIES=false` so visitors see the phone/WhatsApp fallback.

Rotate using replacement-first procedures unless compromise requires immediate revocation:

- **Resend:** create a new sending-only key restricted to the verified domain, update `RESEND_API_KEY` on Render, redeploy, verify notification, then revoke the old key. A sender-domain change also requires DNS verification and `RESEND_FROM_EMAIL` update.
- **MongoDB:** create a replacement database user with the same scoped permissions, update Render's `MONGODB_URI`, redeploy, verify insert/admin listing, then revoke the old user. Update private local setup credentials too.
- **Admin:** run `npm run admin:credentials` on a trusted local copy, save the new password, and privately transfer username/hash to Render. The command also changes the local JWT and resets both local enquiry flags to `false`; restore desired flags before rebuilding. Changing the password hash does **not** revoke existing sessions: also rotate Render's JWT when revocation is required.
- **JWT:** generate a fresh 32-byte base64url secret (the credential generator supplies one), privately update `JWT_SECRET_KEY` on Render, and redeploy. Existing sessions must sign in again; verify login/list/logout. Keep the production JWT stable on routine deploys.

Backend secret changes require a Render restart/deploy, not a frontend upload. A changed API hostname or frontend flag requires a rebuild/upload; a changed website hostname also requires updating Render's exact `FRONTEND_ORIGIN` allowlist. Record the release commit, test results, and rotation time without secret values.
