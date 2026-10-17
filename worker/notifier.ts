import { Buffer } from 'node:buffer'
import { Resend } from 'resend'
import type { Enquiry } from '../server/enquiryRepository'
import logoData from '../server/assets/gauvis-email-logo.png'
import type { WorkerEnv } from './types'

export type WorkerEnquiryNotifier = {
  notify(enquiry: Enquiry): Promise<void>
  notifyAdminLogin(alert: { at: Date; username: string }): Promise<void>
}

type InlineAttachment = { filename: string; content: Buffer; contentId: string; contentType: string }
type NotificationEmail = {
  from: string; to: string; replyTo: string; subject: string; text: string; html: string; attachments?: InlineAttachment[]
}
type EmailTransport = { send(input: NotificationEmail): Promise<{ error?: unknown }> }

function escapeHtml(value: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return value.replace(/[&<>"']/g, (character) => entities[character])
}

function safeRecipient(value: string): boolean {
  return !/[\r\n]/.test(value) && /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(value)
}

function attachments(): InlineAttachment[] {
  return [{ filename: 'gauvis-email-logo.png', content: Buffer.from(logoData), contentId: 'gauvis-tech-logo', contentType: 'image/png' }]
}

function frame(label: string, headline: string, body: string, detail: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(headline)}</title></head><body style="margin:0;padding:0;background:#f3f6fa;color:#53677f;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#f3f6fa;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;"><tr><td style="height:4px;background:#f15a29;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:32px 32px 16px;"><img src="cid:gauvis-tech-logo" width="160" height="57" alt="Gauvis Tech" style="display:block;width:160px;height:auto;border:0;"></td></tr><tr><td style="padding:16px 32px 0;color:#f15a29;font-size:11px;line-height:16px;font-weight:700;letter-spacing:2px;">${escapeHtml(label)}</td></tr><tr><td style="padding:10px 32px 0;color:#0b2c55;font-size:28px;line-height:36px;font-weight:700;">${escapeHtml(headline)}</td></tr><tr><td style="padding:20px 32px 0;color:#53677f;font-size:15px;line-height:25px;">${body}</td></tr><tr><td style="padding:24px 32px 32px;">${detail}</td></tr><tr><td style="border-top:1px solid #dbe5ef;padding:20px 32px 28px;color:#53677f;font-size:12px;line-height:20px;">Gauvis Tech</td></tr></table></td></tr></table></body></html>`
}

function customerReceipt(enquiry: Enquiry): Omit<NotificationEmail, 'from' | 'to' | 'replyTo'> {
  const name = escapeHtml(enquiry.fullName)
  const service = escapeHtml(enquiry.service)
  const body = `<p style="margin:0 0 16px;">Hello ${name},</p><p style="margin:0 0 16px;">Thank you for contacting Gauvis Tech. We received your request for ${service}. Our team will review it and respond using the details you supplied.</p><p style="margin:0;">If you did not send this request, you can ignore this email.</p>`
  const detail = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#edf4fa;"><tr><td style="padding:16px 18px;color:#53677f;font-size:12px;line-height:18px;">REQUESTED SERVICE<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${service}</span></td></tr></table>`
  return { subject: 'We received your Gauvis Tech enquiry', text: `ENQUIRY RECEIVED\nYour request is with our team.\n\nHello ${enquiry.fullName},\n\nThank you for contacting Gauvis Tech. We received your request for ${enquiry.service}. Our team will review it and respond using the details you supplied.\n\nRequested service: ${enquiry.service}\n\nIf you did not send this request, you can ignore this email.\n\nGauvis Tech`, html: frame('ENQUIRY RECEIVED', 'Your request is with our team.', body, detail), attachments: attachments() }
}

function loginAlert(alert: { at: Date; username: string }): Omit<NotificationEmail, 'from' | 'to' | 'replyTo'> {
  const time = alert.at.toISOString()
  const account = escapeHtml(alert.username)
  const body = '<p style="margin:0 0 16px;">The Gauvis Tech admin dashboard was signed into successfully.</p><p style="margin:0;">If this was you, no action is needed. If you do not recognise this sign-in, change your admin password immediately and review access to your account.</p>'
  const detail = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:#edf4fa;"><tr><td style="padding:16px 18px;color:#53677f;font-size:12px;line-height:18px;">ACCOUNT<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${account}</span></td></tr><tr><td style="padding:0 18px 16px;color:#53677f;font-size:12px;line-height:18px;">SIGN-IN TIME (UTC)<br><span style="color:#0b2c55;font-size:15px;line-height:24px;font-weight:700;">${time}</span></td></tr></table>`
  return { subject: 'Gauvis Tech admin sign-in', text: `SECURITY NOTICE\nA sign-in to your dashboard.\n\nThe Gauvis Tech admin dashboard was signed into successfully.\n\nAccount: ${alert.username}\nSign-in time (UTC): ${time}\n\nIf this was you, no action is needed. If you do not recognise this sign-in, change your admin password immediately and review access to your account.\n\nGauvis Tech`, html: frame('SECURITY NOTICE', 'A sign-in to your dashboard.', body, detail), attachments: attachments() }
}

export function createWorkerResendNotifier(
  environment: WorkerEnv,
  createTransport: (apiKey: string) => EmailTransport = (apiKey) => new Resend(apiKey).emails,
): WorkerEnquiryNotifier | null {
  const apiKey = environment.RESEND_API_KEY?.trim()
  const from = environment.RESEND_FROM_EMAIL?.trim()
  const to = environment.ADMIN_EMAIL?.trim()
  if (!apiKey || !from || !to || /[\r\n]/.test(from) || !safeRecipient(to)) return null
  const transport = createTransport(apiKey)
  const send = async (email: NotificationEmail) => {
    const result = await transport.send(email)
    if (result.error) throw new Error('Provider rejected the notification.')
  }

  return {
    async notify(enquiry) {
      const fields = [['Contact name', enquiry.fullName], ['Business name', enquiry.businessName], ['Email', enquiry.email], ['Phone', enquiry.phone], ['Requested service', enquiry.service], ['Location', enquiry.location], ['Message', enquiry.message], ['Submitted at (UTC)', enquiry.createdAt.toISOString()]]
      const team: NotificationEmail = { from, to, replyTo: enquiry.email, subject: `New ${enquiry.service} enquiry from ${enquiry.fullName}`.replace(/[\r\n]+/g, ' '), text: fields.map(([label, value]) => `${label}: ${value}`).join('\n\n'), html: `<h1>New website enquiry</h1><dl>${fields.map(([label, value]) => `<dt>${label}</dt><dd style="white-space:pre-wrap">${escapeHtml(value)}</dd>`).join('')}</dl>` }
      const customer: NotificationEmail = { from, to: enquiry.email, replyTo: to, ...customerReceipt(enquiry) }
      const outcomes = await Promise.allSettled([send(team), send(customer)])
      if (outcomes.some((outcome) => outcome.status === 'rejected')) throw new Error('Enquiry notification could not be delivered.')
    },
    async notifyAdminLogin(alert) {
      try { await send({ from, to, replyTo: to, ...loginAlert(alert) }) } catch { throw new Error('Admin sign-in notification could not be delivered.') }
    },
  }
}
