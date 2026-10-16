# Gauvis Tech website

React frontend with an Express enquiry API, MongoDB storage, Resend team notifications, and an authenticated enquiry dashboard.

## Local development

1. Install Node.js 22.12+ and run `npm ci`.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI` for a development database; keep secrets out of version control.
3. Run `npm run db:setup` to create the validated collection and indexes. The runtime user also needs schema-management privileges because the API checks the schema on first access.
4. For local admin access, run `npm run admin:credentials` and save the one-time password in a password manager. This updates `.env` and resets both enquiry flags to `false`.
5. Once approved legal content is published, set `ENABLE_ENQUIRIES=true` and `VITE_ENABLE_ENQUIRIES=true` to test submissions. Otherwise leave collection disabled.
6. Run `npm run dev` and open `http://localhost:5173`. Leave `VITE_API_BASE_URL` empty to use Vite's `/api` proxy to port 3001. Leave `FRONTEND_ORIGIN` empty for local same-origin development.

Notifications are optional locally: without all three `RESEND_*` values, accepted enquiries are stored without email. Database failure never produces a successful delivery response.

## Production and verification

Follow [DEPLOYMENT.md](DEPLOYMENT.md) for the complete Render API, MongoDB Atlas, Resend, and DirectAdmin procedure, environment matrix, quality gate, browser tests, rollback, and credential rotation.

Production builds require an HTTPS `VITE_API_BASE_URL`. `npm run package:directadmin` builds and creates `release/directadmin`; upload its contents, including `.htaccess`, to the domain's `public_html`.

The original design prototypes remain in `project/` as reference material.
