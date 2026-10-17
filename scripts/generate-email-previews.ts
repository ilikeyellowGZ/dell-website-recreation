import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createConfiguredResendNotifier, type NotificationEmail } from '../server/enquiryNotifier'
import type { Enquiry } from '../server/enquiryRepository'

const outputDirectory = resolve('previews/emails')
const sample: Enquiry = {
  fullName: 'Thandi Ndlovu',
  businessName: 'Ndlovu Trading',
  email: 'thandi@example.com',
  phone: '+27 84 123 4567',
  service: 'Hardware Support',
  location: 'Cape Town',
  message: 'We need help replacing three office computers and setting them up for our team.',
  consent: true,
  createdAt: new Date('2026-10-17T08:00:00.000Z'),
  source: 'website',
  status: 'new',
}

const sent: NotificationEmail[] = []
const notifier = createConfiguredResendNotifier({
  RESEND_API_KEY: 'preview-only',
  RESEND_FROM_EMAIL: 'Gauvis Tech <enquiries@notifications.example.com>',
  ADMIN_EMAIL: 'team@example.com',
}, () => ({
  async send(email) {
    sent.push(email)
    return { error: null }
  },
}))

if (!notifier) throw new Error('Preview notifier could not be created.')
await notifier.notify(sample)
await notifier.notifyAdminLogin({ at: new Date('2026-10-17T08:15:00.000Z'), username: 'admin' })

mkdirSync(outputDirectory, { recursive: true })
const names = ['team-enquiry', 'customer-receipt', 'admin-sign-in'] as const
for (const [index, name] of names.entries()) {
  const email = sent[index]
  let html = email.html
  for (const attachment of email.attachments ?? []) {
    html = html.replaceAll(
      `cid:${attachment.contentId}`,
      `data:${attachment.contentType};base64,${attachment.content.toString('base64')}`,
    )
  }
  writeFileSync(resolve(outputDirectory, `${name}.html`), html, 'utf8')
  writeFileSync(resolve(outputDirectory, `${name}.txt`),
    `Subject: ${email.subject}\nFrom: ${email.from}\nTo: ${email.to}\nReply-To: ${email.replyTo}\n\n${email.text}\n`, 'utf8')
}

console.log(`Generated sample-only email previews in ${outputDirectory}. No email was sent.`)
