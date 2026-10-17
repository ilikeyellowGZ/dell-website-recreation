# Gauvis Tech website

React frontend with an Express enquiry API, MongoDB storage, Resend team notifications and customer receipts, and an authenticated enquiry dashboard.

## Local development

1. Install Node.js 24 LTS and run `npm ci`.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI` for a development database; keep secrets out of version control.
3. Run `npm run db:setup` to create the validated collection and indexes. The runtime user also needs schema-management privileges because the API checks the schema on first access.
4. For local admin access, run `npm run admin:credentials` and save the one-time password in a password manager. This updates `.env` and resets both enquiry flags to `false`.
5. Once approved legal content is published, set `ENABLE_ENQUIRIES=true` and `VITE_ENABLE_ENQUIRIES=true` to test submissions. Otherwise leave collection disabled.
6. Run `npm run dev` and open `http://localhost:5173`. Leave `VITE_API_BASE_URL` empty to use Vite's `/api` proxy to port 3001. Leave `FRONTEND_ORIGIN` empty for local same-origin development.

Notifications are optional locally: without `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ADMIN_EMAIL`, accepted enquiries are stored without email and admin sign-ins still work without alerts. After successful storage, Resend sends a detailed team notification to `ADMIN_EMAIL` and a branded receipt to the customer's address. Successful admin sign-ins also send a branded security alert to `ADMIN_EMAIL`; failed sign-ins do not. Login alerts are limited to one per 15 minutes by default, without affecting sign-in. The receipt and login alert include the existing Gauvis Tech logo as an embedded image, with text-only alternatives. Configure `RESEND_FROM_EMAIL` at a verified sending domain; `team@example.com` in `.env.example` is only a recipient placeholder. `RESEND_TO_EMAIL` remains a temporary backward-compatible fallback only. Database failure never produces a successful delivery response.

## Production and verification

Follow [DEPLOYMENT.md](DEPLOYMENT.md) for the existing API, MongoDB Atlas, Resend, and Cloudflare deployment procedure, environment matrix, quality gate, browser tests, rollback, and credential rotation.

Cloudflare now serves both the frontend and API from the same Worker origin. Keep `VITE_API_BASE_URL` empty for the normal deployment so browser calls use `/api`; this removes the old Render CORS dependency. See [DEPLOYMENT.md](DEPLOYMENT.md) and [Cloudflare migration notes](docs/cloudflare-migration.md) for the secrets, deploy commands, cutover, and rollback procedure.

Each production website load sends a background request to `/api/health`; browsing does not wait for it. After signing in at `/admin/login`, `/admin/enquiries` shows a searchable, sortable dashboard with service/location grouping and full record details. The dashboard covers the latest 100 enquiries returned by the API, not an all-time total.

The original design prototypes remain in `project/` as reference material.
