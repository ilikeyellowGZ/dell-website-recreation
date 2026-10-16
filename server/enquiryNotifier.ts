import { Resend } from 'resend'
import type { Enquiry } from './enquiryRepository'

export type EnquiryNotifier = { notify(enquiry: Enquiry): Promise<void> }

export type NotificationEmail = {
  from: string
  to: string
  replyTo: string
  subject: string
  text: string
  html: string
}

type EmailTransport = { send(input: NotificationEmail): Promise<{ error?: unknown }> }

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

export function createConfiguredResendNotifier(
  environment: NodeJS.ProcessEnv = process.env,
  createTransport: (apiKey: string) => EmailTransport = (apiKey) => new Resend(apiKey).emails,
): EnquiryNotifier | null {
  const apiKey = environment.RESEND_API_KEY?.trim()
  const from = environment.RESEND_FROM_EMAIL?.trim()
  const to = environment.RESEND_TO_EMAIL?.trim()
  if (!apiKey || !from || !to) return null

  const transport = createTransport(apiKey)
  return {
    async notify(enquiry) {
      const fields = [
        ['Contact name', enquiry.fullName],
        ['Business name', enquiry.businessName],
        ['Email', enquiry.email],
        ['Phone', enquiry.phone],
        ['Requested service', enquiry.service],
        ['Location', enquiry.location],
        ['Message', enquiry.message],
        ['Submitted at (UTC)', enquiry.createdAt.toISOString()],
      ]
      try {
        const result = await transport.send({
          from,
          to,
          replyTo: enquiry.email,
          subject: `New ${enquiry.service} enquiry from ${enquiry.fullName}`.replace(/[\r\n]+/g, ' '),
          text: fields.map(([label, value]) => `${label}: ${value}`).join('\n\n'),
          html: `<h1>New website enquiry</h1><dl>${fields.map(([label, value]) =>
            `<dt>${label}</dt><dd style="white-space:pre-wrap">${escapeHtml(value)}</dd>`,
          ).join('')}</dl>`,
        })
        if (result.error) throw new Error('Provider rejected the notification.')
      } catch {
        // Provider errors can contain credentials and enquiry content; do not retain a cause.
        throw new Error('Enquiry notification could not be delivered.')
      }
    },
  }
}
