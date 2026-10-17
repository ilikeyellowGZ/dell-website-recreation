# Gauvis Tech transactional email templates

## Intent and scope

Design two clear, polished transactional emails for the existing Resend flow: a receipt sent to a customer after a website enquiry is stored, and a security alert sent to the configured team mailbox after a successful admin sign-in. The existing detailed team enquiry notification, recipients, sending rules, and failure behavior remain unchanged.

The user approved a quiet editorial direction inspired by Apple's restraint, not a copy of Apple's branding: generous white space, strong type hierarchy, the existing Gauvis Tech logo, deep navy text, and a small orange accent.

## Shared visual system

- Use a responsive email-safe HTML table no wider than 600px, with inline styles and comfortable spacing at mobile widths.
- Use a white primary surface, Gauvis navy `#0b2c55` for the heading, muted body text `#53677f`, and a narrow orange `#f15a29` accent. These values come from `DESIGN.md`.
- Place the actual Gauvis Tech logo from `project/gvt-logo.png` in the header of both emails, scaled to fit without crowding the headline. Send an optimized PNG copy as a CID inline attachment through Resend; do not rely on a remote image URL or use the website's WebP version. Resend documents `contentId` inline attachments at https://resend.com/changelog/embed-images-using-cid.
- Provide `alt="Gauvis Tech"` on the logo and visible Gauvis Tech text in the footer, so the sender and purpose remain clear when an email client blocks inline images. Use a system sans-serif stack, with no external font, script, tracking pixel, or remote CSS.
- Keep a restrained header, one clear headline, short explanatory copy, a compact detail block, and a quiet footer. Avoid decorative hero imagery and sales language.
- Provide matching text-only content for email clients that do not display HTML. Subject and first visible line must identify the purpose without relying on color.

## Customer enquiry receipt

- Subject: `We received your Gauvis Tech enquiry`.
- Opening label: `ENQUIRY RECEIVED`; headline: `Your request is with our team.`
- Greet the customer by their validated name. State that Gauvis Tech received the request for the selected service and will review it and respond using the details supplied. Do not promise a response time or imply work is already scheduled.
- Show the requested service in a compact detail row. Do not repeat the customer's full message, phone number, or other personal details in the receipt.
- End with `If you did not send this request, you can ignore this email.` A reply to this email goes to the configured team mailbox.

## Admin sign-in alert

- Subject: `Gauvis Tech admin sign-in`.
- Opening label: `SECURITY NOTICE`; headline: `A sign-in to your dashboard.`
- State explicitly that the admin dashboard was signed into successfully and show the event time in UTC.
- End with `If this was you, no action is needed. If you do not recognise this sign-in, change your admin password immediately and review access to your account.`
- Send only to the configured team mailbox. Include no password, session token, IP address, device fingerprint, or sign-in link.

## Architecture and safety

- Keep the existing Resend notifier and replace only the HTML and text bodies for these two messages, plus the CID logo attachment those bodies reference. A small shared renderer may own the frame and styles; each message retains its own content and purpose.
- Escape all dynamic text before inserting it into HTML. Preserve the existing validated recipient addresses and generic provider-error handling.
- Customer receipts are attempted only after MongoDB accepts a valid, non-honeypot enquiry. Alerts are attempted only after successful credential verification. Sending failures do not roll back a stored enquiry or reject a valid login.
- Keep `RESEND_TO_EMAIL=team@example.com` as the configuration example; no real recipient, sender, or secret enters source control.

## Verification

- Test subject, recipients, plain-text purpose, HTML purpose, logo CID reference and matching inline PNG attachment, service and UTC-time details, and HTML escaping of customer-provided text.
- Check that no credential or customer message leaks into the wrong email.
- Run the targeted notifier and API tests, full tests, typecheck, lint, and production build.
- Preview the generated HTML at narrow and desktop widths when a browser renderer is available; inspect text-only output separately. Real Resend delivery still requires the user's verified sender domain, API key, and real team recipient in Render.
