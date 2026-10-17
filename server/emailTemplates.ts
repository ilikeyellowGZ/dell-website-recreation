import { readFileSync } from 'node:fs'
import type { Enquiry } from './enquiryRepository'

const logo = readFileSync(new URL('./assets/gauvis-email-logo.png', import.meta.url))
const logoContentId = 'gauvis-tech-logo'

export type BrandedEmailContent = {
  subject: string
  text: string
  html: string
  attachments: {
    filename: string
    content: Buffer
    contentId: string
    contentType: string
  }[]
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return value.replace(/[&<>"']/g, (character) => entities[character])
}

function attachment(): BrandedEmailContent['attachments'] {
  return [{
    filename: 'gauvis-email-logo.png',
    content: Buffer.from(logo),
    contentId: logoContentId,
    contentType: 'image/png',
  }]
}

function renderFrame(label: string, headline: string, body: string, detail: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(headline)}</title></head>
<body style="margin:0;padding:0;background:#f3f6fa;color:#53677f;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#f3f6fa;"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;">
      <tr><td style="height:4px;background:#f15a29;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:32px 32px 16px;"><img src="cid:${logoContentId}" width="160" height="57" alt="Gauvis Tech" style="display:block;width:160px;height:auto;border:0;"></td></tr>
      <tr><td style="padding:16px 32px 0;color:#f15a29;font-size:11px;line-height:16px;font-weight:700;letter-spacing:2px;">${escapeHtml(label)}</td></tr>
      <tr><td style="padding:10px 32px 0;color:#0b2c55;font-size:28px;line-height:36px;font-weight:700;">${escapeHtml(headline)}</td></tr>
      <tr><td style="padding:20px 32px 0;color:#53677f;font-size:15px;line-height:25px;">${body}</td></tr>
      <tr><td style="padding:24px 32px 32px;">${detail}</td></tr>
      <tr><td style="border-top:1px solid #dbe5ef;padding:20px 32px 28px;color:#53677f;font-size:12px;line-height:20px;">Gauvis Tech</td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

export function renderCustomerReceipt(enquiry: Pick<Enquiry, 'fullName' | 'service'>): BrandedEmailContent {
  const name = escapeHtml(enquiry.fullName)
  const service = escapeHtml(enquiry.service)
  const body = `<p style="margin:0 0 16px;">Hello ${name},</p><p style="margin:0 0 16px;">Thank you for contacting Gauvis Tech. We received your request for ${service}. Our team will review it and respond using the details you supplied.</p><p style="margin:0;">If you did not send this request, you can ignore this email.</p>`
  const detail = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#edf4fa;"><tr><td style="padding:16px 18px;color:#53677f;font-size:12px;line-height:18px;">REQUESTED SERVICE<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${service}</span></td></tr></table>`
  return {
    subject: 'We received your Gauvis Tech enquiry',
    text: `ENQUIRY RECEIVED\nYour request is with our team.\n\nHello ${enquiry.fullName},\n\nThank you for contacting Gauvis Tech. We received your request for ${enquiry.service}. Our team will review it and respond using the details you supplied.\n\nRequested service: ${enquiry.service}\n\nIf you did not send this request, you can ignore this email.\n\nGauvis Tech`,
    html: renderFrame('ENQUIRY RECEIVED', 'Your request is with our team.', body, detail),
    attachments: attachment(),
  }
}

export function renderAdminLoginAlert({ at, username }: { at: Date; username: string }): BrandedEmailContent {
  const time = at.toISOString()
  const account = escapeHtml(username)
  const body = '<p style="margin:0 0 16px;">The Gauvis Tech admin dashboard was signed into successfully.</p><p style="margin:0;">If this was you, no action is needed. If you do not recognise this sign-in, change your admin password immediately and review access to your account.</p>'
  const detail = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#edf4fa;"><tr><td style="padding:16px 18px;color:#53677f;font-size:12px;line-height:18px;">ACCOUNT<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${account}</span></td></tr><tr><td style="padding:0 18px 16px;color:#53677f;font-size:12px;line-height:18px;">SIGN-IN TIME (UTC)<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${time}</span></td></tr></table>`
  return {
    subject: 'Gauvis Tech admin sign-in',
    text: `SECURITY NOTICE\nA sign-in to your dashboard.\n\nThe Gauvis Tech admin dashboard was signed into successfully.\n\nAccount: ${username}\nSign-in time (UTC): ${time}\n\nIf this was you, no action is needed. If you do not recognise this sign-in, change your admin password immediately and review access to your account.\n\nGauvis Tech`,
    html: renderFrame('SECURITY NOTICE', 'A sign-in to your dashboard.', body, detail),
    attachments: attachment(),
  }
}
