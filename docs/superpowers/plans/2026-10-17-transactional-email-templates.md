# Gauvis Tech Transactional Email Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send distinctive Gauvis Tech-branded customer receipts and admin sign-in alerts through the existing Resend notifier.

**Architecture:** Add a focused server-side template module with a shared inline-styled email frame and two purpose-specific messages. Embed a small copy of the existing PNG logo by CID, then have the existing notifier attach it to the customer and login emails without changing the detailed team enquiry email, delivery order, or error handling.

**Tech Stack:** TypeScript, Node.js 24, Resend 6.13, Sharp 0.35 for one-time asset preparation, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-17-transactional-email-templates-design.md`

## Global Constraints

- Use `project/gvt-logo.png` as the visual master; do not recreate or recolor the logo.
- Use a table-based HTML frame no wider than 600px with inline styles, system sans-serif, white background, navy `#0b2c55`, muted `#53677f`, and orange `#f15a29`.
- The actual logo is a CID inline PNG attachment; include `alt="Gauvis Tech"` and visible brand text even when images are blocked. No external fonts, images, scripts, tracking pixels, or remote CSS.
- Customer copy must not include the enquiry message, phone, or response-time promise. Login copy must not include passwords, tokens, IP, device fingerprint, or sign-in links.
- Escape dynamic HTML text. Keep the existing stored-enquiry and successful-login gates, team notification, generic errors, and `RESEND_TO_EMAIL=team@example.com` example unchanged.
- Keep all prior worktree edits; use path-limited staging and commits only.

---

### Task 1: Shared frame, logo, and two email bodies

**Files:**
- Create: `server/emailTemplates.ts`
- Create: `server/emailTemplates.test.ts`
- Create: `server/assets/gauvis-email-logo.png` from `project/gvt-logo.png`

**Interfaces:**
- Consumes: `Enquiry` from `server/enquiryRepository.ts` for `fullName` and `service`.
- Produces: `renderCustomerReceipt(enquiry: Pick<Enquiry, 'fullName' | 'service'>): BrandedEmailContent` and `renderAdminLoginAlert(at: Date): BrandedEmailContent`. `BrandedEmailContent` has `subject`, `text`, `html`, and `attachments: [{ filename: 'gauvis-email-logo.png', content: Buffer, contentId: 'gauvis-tech-logo', contentType: 'image/png' }]`.

- [ ] **Step 1: Write failing tests** in `server/emailTemplates.test.ts` that call both renderers. Assert the exact subjects from the spec, `cid:gauvis-tech-logo`, `alt="Gauvis Tech"`, inline `<table` layout, navy and orange token use, visible brand footer, matching attachment CID and PNG magic bytes, purpose-specific text, service or UTC time, and absence of the customer's message and any credential. A malicious name `<img src=x onerror="alert(1)">` must appear HTML-escaped, not as a tag.

```ts
const receipt = renderCustomerReceipt({ fullName: '<img src=x onerror="alert(1)">', service: 'Hardware Support' })
expect(receipt.subject).toBe('We received your Gauvis Tech enquiry')
expect(receipt.html).toContain('cid:gauvis-tech-logo')
expect(receipt.html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
expect(receipt.html).not.toContain('<img src=x onerror=')
expect(receipt.attachments[0].content.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
const alert = renderAdminLoginAlert(new Date('2026-10-17T08:00:00.000Z'))
expect(alert.text).toContain('2026-10-17T08:00:00.000Z')
expect(alert.text).toContain('If this was you, no action is needed.')
```

- [ ] **Step 2: Run the targeted test and confirm it fails because the renderer is absent.**

```powershell
npx vitest run server/emailTemplates.test.ts
```

- [ ] **Step 3: Generate the email PNG copy** from the existing logo, preserving transparency. Inspect dimensions and size; commit the generated asset, not a runtime Sharp dependency. The source is 575px wide and 102945 bytes, so a 320px email copy keeps the displayed width crisp without sending the full source each time.

```powershell
New-Item -ItemType Directory -Force -Path server/assets | Out-Null
node -e "import('sharp').then(({default: sharp}) => sharp('project/gvt-logo.png').resize({width:320,withoutEnlargement:true}).png({compressionLevel:9}).toFile('server/assets/gauvis-email-logo.png'))"
```

- [ ] **Step 4: Implement `server/emailTemplates.ts`.** Load the committed PNG with `readFileSync(new URL('./assets/gauvis-email-logo.png', import.meta.url))`; return a fresh attachment descriptor for each render call. Use one `escapeHtml` helper for dynamic text and one `renderFrame(label, headline, body, detail)` helper for the shared 600px table. Keep all styles inline and include `<img src="cid:gauvis-tech-logo" width="160" alt="Gauvis Tech">` plus visible footer text. Customer copy says the request was received and will be reviewed; login copy states a successful sign-in, UTC time, and what to do if unrecognised.

```ts
export type BrandedEmailContent = {
  subject: string
  text: string
  html: string
  attachments: { filename: string; content: Buffer; contentId: string; contentType: string }[]
}

export function renderCustomerReceipt(enquiry: Pick<Enquiry, 'fullName' | 'service'>): BrandedEmailContent
export function renderAdminLoginAlert(at: Date): BrandedEmailContent
```

- [ ] **Step 5: Run the targeted test and typecheck, then stage and commit only Task 1 files.**

```powershell
npx vitest run server/emailTemplates.test.ts
npm run typecheck
git add -- server/emailTemplates.ts server/emailTemplates.test.ts server/assets/gauvis-email-logo.png
git commit -m "feat: add branded transactional email templates"
```

### Task 2: Wire templates into existing Resend flow

**Files:**
- Modify: `server/enquiryNotifier.ts`
- Modify: `server/enquiryNotifier.test.ts`
- Modify: `README.md`
- Modify: `DEPLOYMENT.md`

**Interfaces:**
- Consumes: `renderCustomerReceipt`, `renderAdminLoginAlert`, and `BrandedEmailContent` from Task 1.
- Produces: the same `createConfiguredResendNotifier()` API; customer and login `NotificationEmail` payloads gain `attachments` while the detailed team enquiry email remains unchanged.

- [ ] **Step 1: Extend the notifier tests before production code.** Assert that the second enquiry send and the successful-login send carry the matching inline attachment and use the branded HTML/text. Assert the first, detailed team send has no new CID attachment; the existing HTML escaping, independent team/customer attempts, and sanitized failure tests must still pass.

```ts
await notifier!.notify(enquiry)
expect(sent[0].attachments).toBeUndefined()
expect(sent[1].html).toContain('Your request is with our team.')
expect(sent[1].attachments?.[0].contentId).toBe('gauvis-tech-logo')
await notifier!.notifyAdminLogin(new Date('2026-10-17T08:00:00.000Z'))
expect(sent[2].html).toContain('A sign-in to your dashboard.')
expect(sent[2].attachments?.[0].contentType).toBe('image/png')
```

- [ ] **Step 2: Run the targeted test and confirm it fails because existing sends have no branded frame or logo.**

```powershell
npx vitest run server/enquiryNotifier.test.ts
```

- [ ] **Step 3: Extend `NotificationEmail` with an optional `attachments` array matching `BrandedEmailContent['attachments']`.** Replace only the customer `subject`, `text`, and `html` values with `renderCustomerReceipt(enquiry)`, and only the login values with `renderAdminLoginAlert(at)`. Spread each renderer's content into the corresponding Resend payload. Do not change recipients, `replyTo`, team email content, `Promise.allSettled`, or provider-error handling.

```ts
const customerEmail: NotificationEmail = {
  from,
  to: enquiry.email,
  replyTo: to,
  ...renderCustomerReceipt(enquiry),
}

const loginEmail: NotificationEmail = {
  from,
  to,
  replyTo: to,
  ...renderAdminLoginAlert(at),
}
```

- [ ] **Step 4: Update README and deployment notes** to say customer receipts and successful-login alerts include the embedded Gauvis logo. Keep the sender-domain and example-recipient requirements explicit. Run the targeted tests, then commit only Task 2 files.

```powershell
npx vitest run server/enquiryNotifier.test.ts server/app.test.ts
git add -- server/enquiryNotifier.ts server/enquiryNotifier.test.ts README.md DEPLOYMENT.md
git commit -m "feat: send branded customer and admin emails"
```

### Task 3: Full verification and visual review

**Files:**
- No required production file edits; repair only defects found in the two templates.

**Interfaces:**
- Consumes: both template renderers and the existing API and notifier test suites.
- Produces: verified build and a concise deployment handoff; no live email is sent without a real Render configuration.

- [ ] **Step 1: Run all automated checks and inspect final diff.**

```powershell
npm test -- --run
npm run typecheck
npm run lint
$env:VITE_API_BASE_URL='https://guavis.onrender.com'; npm run build
npm audit --omit=dev --audit-level=high
git diff --check
git status --short
```

- [ ] **Step 2: Preview both HTML bodies** at narrow and desktop widths if a browser renderer is available. Check logo scale, readable headings, spacing, no clipping, and visible text when images are blocked. If no browser renderer is available, inspect generated HTML, PNG dimensions, and text bodies; report that visual email-client verification remains outstanding.

- [ ] **Step 3: Handoff deployment conditions.** State that Render must deploy the backend changes with a verified `RESEND_FROM_EMAIL`, real `RESEND_TO_EMAIL`, and `RESEND_API_KEY`. The example `team@example.com` cannot deliver real team alerts. Verify one test enquiry and one successful admin sign-in in staging before treating delivery as live; no DirectAdmin upload is required for these backend-only templates.
