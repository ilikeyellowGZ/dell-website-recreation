import { readFileSync } from 'node:fs'
import type { Enquiry } from './enquiryRepository'

const logo = readFileSync(new URL('./assets/gauvis-email-logo.png', import.meta.url) as Parameters<typeof readFileSync>[0])
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

function enquiryReference(enquiry: Pick<Enquiry, 'reference'>): string {
  return enquiry.reference || 'Reference pending'
}

export function renderTeamEnquiry(enquiry: Enquiry): BrandedEmailContent {
  const fields = [
    ['Reference', enquiryReference(enquiry)], ['Customer', enquiry.fullName], ['Email', enquiry.email],
    ['Phone', enquiry.phone || 'Not supplied'], ['Service', enquiry.service], ['Business', enquiry.businessName || 'Not supplied'],
    ['Location', enquiry.location || 'Not supplied'], ['Submitted (UTC)', enquiry.createdAt.toISOString()], ['Message', enquiry.message],
  ]
  const rows = fields.map(([label, value]) => `<tr><td style="padding:8px 12px;color:#53677f;font-size:12px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#0b2c55;font-size:14px;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`).join('')
  return {
    subject: 'New Website Enquiry — GuavisTech',
    text: fields.map(([label, value]) => `${label}: ${value}`).join('\n\n'),
    html: renderFrame('NEW WEBSITE ENQUIRY', `Enquiry ${enquiryReference(enquiry)}`, '<p style="margin:0;">A new customer enquiry has been stored by the GuavisTech website.</p>', `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#edf4fa;">${rows}</table>`),
    attachments: attachment(),
  }
}

export function renderCustomerReceipt(enquiry: Pick<Enquiry, 'fullName' | 'service'> & Partial<Pick<Enquiry, 'message' | 'reference'>>): BrandedEmailContent {
  const firstNameValue = enquiry.fullName.trim().split(/\s+/)[0] || enquiry.fullName
  const name = escapeHtml(firstNameValue)
  const service = escapeHtml(enquiry.service)
  const reference = escapeHtml(enquiryReference(enquiry))
  const messageValue = enquiry.message || 'Not supplied'
  const message = escapeHtml(messageValue)
  const body = `<p style="margin:0 0 16px;">Hello ${name},</p><p style="margin:0 0 16px;">Thank you for contacting GuavisTech. We’ve received your enquiry and our team will review it carefully.</p><p style="margin:0;">We’ll respond using the contact details you supplied. If you did not send this request, you can ignore this email.</p>`
  const detail = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#edf4fa;"><tr><td style="padding:16px 18px;color:#53677f;font-size:12px;line-height:18px;">REFERENCE<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${reference}</span></td></tr><tr><td style="padding:0 18px 8px;color:#53677f;font-size:12px;line-height:18px;">REQUESTED SERVICE<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${service}</span></td></tr><tr><td style="padding:8px 18px 16px;color:#53677f;font-size:12px;line-height:18px;">YOUR MESSAGE<br><span style="color:#0b2c55;font-size:14px;line-height:22px;white-space:pre-wrap;">${message}</span></td></tr></table>`
  return {
    subject: "We've Received Your Enquiry — GuavisTech",
    text: `ENQUIRY RECEIVED\nWe’ve received your enquiry.\n\nHello ${firstNameValue},\n\nThank you for contacting GuavisTech. Our team will review your enquiry and respond using the contact details you supplied.\n\nReference: ${enquiryReference(enquiry)}\nRequested service: ${enquiry.service}\nYour message: ${enquiry.message}\n\nGauvisTech`,
    html: renderFrame('ENQUIRY RECEIVED', 'We’ve received your enquiry.', body, detail),
    attachments: attachment(),
  }
}

export function renderAdminLoginAlert({ at, username, ipAddress, userAgent }: { at: Date; username: string; ipAddress?: string; userAgent?: string }): BrandedEmailContent {
  const time = at.toISOString()
  const account = escapeHtml(username)
  const body = '<p style="margin:0 0 16px;">The Gauvis Tech admin dashboard was signed into successfully.</p><p style="margin:0;">If this was you, no action is needed. If you do not recognise this sign-in, change your admin password immediately and review access to your account.</p>'
  const safeIp = escapeHtml(ipAddress || 'Unavailable')
  const safeAgent = escapeHtml(userAgent || 'Unavailable')
  const detail = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#edf4fa;"><tr><td style="padding:16px 18px;color:#53677f;font-size:12px;line-height:18px;">ACCOUNT<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${account}</span></td></tr><tr><td style="padding:0 18px 8px;color:#53677f;font-size:12px;line-height:18px;">LOGIN STATUS<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">Successful</span></td></tr><tr><td style="padding:8px 18px;color:#53677f;font-size:12px;line-height:18px;">IP ADDRESS<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${safeIp}</span></td></tr><tr><td style="padding:8px 18px;color:#53677f;font-size:12px;line-height:18px;">BROWSER / DEVICE<br><span style="color:#0b2c55;font-size:14px;line-height:22px;font-weight:700;">${safeAgent}</span></td></tr><tr><td style="padding:8px 18px 16px;color:#53677f;font-size:12px;line-height:18px;">SIGN-IN TIME (UTC)<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${time}</span></td></tr></table>`
  return {
    subject: 'Admin Login Alert — GuavisTech',
    text: `SECURITY NOTICE\nA sign-in to your dashboard.\n\nThe Gauvis Tech admin dashboard was signed into successfully.\n\nAccount: ${username}\nSign-in time (UTC): ${time}\n\nIf this was you, no action is needed. If you do not recognise this sign-in, change your admin password immediately and review access to your account.\n\nGauvis Tech`,
    html: renderFrame('SECURITY NOTICE', 'A sign-in to your dashboard.', body, detail),
    attachments: attachment(),
  }
}

export function renderAdminFailedLoginAlert({ at, username, attempts, ipAddress, userAgent }: { at: Date; username: string; attempts: number; ipAddress?: string; userAgent?: string }): BrandedEmailContent {
  const time = at.toISOString()
  const detail = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#fff3ed;"><tr><td style="padding:16px 18px;color:#53677f;font-size:12px;">ACCOUNT ENTERED<br><span style="color:#0b2c55;font-size:15px;font-weight:700;">${escapeHtml(username)}</span></td></tr><tr><td style="padding:8px 18px;color:#53677f;font-size:12px;">FAILED ATTEMPTS<br><span style="color:#0b2c55;font-size:15px;font-weight:700;">${attempts}</span></td></tr><tr><td style="padding:8px 18px;color:#53677f;font-size:12px;">IP ADDRESS<br><span style="color:#0b2c55;font-size:14px;">${escapeHtml(ipAddress || 'Unavailable')}</span></td></tr><tr><td style="padding:8px 18px;color:#53677f;font-size:12px;">BROWSER / DEVICE<br><span style="color:#0b2c55;font-size:14px;">${escapeHtml(userAgent || 'Unavailable')}</span></td></tr><tr><td style="padding:8px 18px 16px;color:#53677f;font-size:12px;">TIME (UTC)<br><span style="color:#0b2c55;font-size:14px;">${time}</span></td></tr></table>`
  return {
    subject: 'Suspicious Admin Login Attempts — GuavisTech',
    text: `SECURITY WARNING\n\n${attempts} failed admin login attempts were detected.\nAccount entered: ${username}\nIP address: ${ipAddress || 'Unavailable'}\nBrowser/device: ${userAgent || 'Unavailable'}\nTime (UTC): ${time}\n\nNo password, token, or cookie is included in this alert.`,
    html: renderFrame('SECURITY WARNING', 'Repeated admin sign-in failures detected.', '<p style="margin:0;">Review this activity. No password, session token or authentication cookie is included.</p>', detail),
    attachments: attachment(),
  }
}
