# Gauvis Cloudflare migration notes

## Runtime architecture

`worker/index.ts` adapts the existing `server/app.ts` Express application through Cloudflare's Node HTTP compatibility layer. The Worker receives only `/api/*`; Worker Static Assets serve the React/Vite build and SPA routes. Consequently browser requests use `/api` on the same hostname and no production CORS allowlist or Render URL is involved.

Both the existing `POST /api/admin/login` route and the `POST /api/auth/login` compatibility alias use the same validation, scrypt password verification, JWT cookie, same-origin checks, and Durable Object rate limit.

`MongoEnquiryDurableObject` owns the MongoDB client so a warm Durable Object can reuse the Atlas connection. `SecurityDurableObject` holds the short-lived HMAC-keyed rate-limit counters and global admin-alert cooldown. These are Cloudflare platform bindings, not a new external database or queue.

## Compatibility decisions

- Express 5, `jose`, `scrypt`, Helmet, compression, Resend, and MongoDB driver 7 run through `nodejs_compat` and the Node HTTP server compatibility flag.
- Express `app.listen()` is still used only as Cloudflare's Node HTTP routing key; it does not bind an internet port in deployed Workers.
- Node file-system email-logo loading cannot be executed from Wrangler's single-file bundle. The Worker imports the same PNG as a Wrangler `Data` module, preserving the inline Gauvis logo in Resend messages.
- MongoDB Atlas is supported with the native MongoDB driver. A normal Worker cannot reuse TCP objects between requests, hence the Durable Object connection holder.

## Local Worker testing

Copy `.dev.vars.example` to `.dev.vars` and add non-production values. Start the complete deployment with:

```powershell
npm run dev:worker
```

Then validate `http://127.0.0.1:8787/`, a React deep link such as `/services/hardware-support`, and `http://127.0.0.1:8787/api/health`. Local success confirms routing and Worker startup. It does not prove live Atlas networking, Resend delivery, custom-domain TLS, or Cloudflare production secret configuration.
