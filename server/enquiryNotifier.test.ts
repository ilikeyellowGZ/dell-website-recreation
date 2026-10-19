// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Enquiry } from './enquiryRepository'
import { createConfiguredResendNotifier, type NotificationEmail } from './enquiryNotifier'

const environment = {
  RESEND_API_KEY: 're_test_notification_key',
  RESEND_FROM_EMAIL: 'Gauvis <enquiries@notifications.example.com>',
  RESEND_TO_EMAIL: 'team@example.com',
}

const enquiry: Enquiry = {
  reference: 'GVT-20261016-ABCDEF123456',
  fullName: 'Thandi Ndlovu',
  businessName: 'Ndlovu Trading',
  email: 'thandi@example.com',
  phone: '+27 84 123 4567',
  service: 'Hardware Support',
  location: 'Cape Town',
  message: 'Please help replace three computers.\nWe need setup too.',
  consent: true,
  createdAt: new Date('2026-10-16T10:30:00.000Z'),
  source: 'website',
  status: 'new',
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Resend enquiry notifications', () => {
  it('uses the official SDK to notify the team and confirm receipt to the customer', async () => {
    const requests: { url: string; options: RequestInit }[] = []
    vi.stubGlobal('fetch', async (url: string, options: RequestInit) => {
      requests.push({ url, options })
      return Response.json({ id: 'test-email-id' })
    })

    await createConfiguredResendNotifier(environment)!.notify(enquiry)

    expect(requests).toHaveLength(2)
    expect(requests[0].url).toBe('https://api.resend.com/emails')
    expect(requests[0].options.method).toBe('POST')
    const teamBody = JSON.parse(String(requests[0].options.body))
    const customerBody = JSON.parse(String(requests[1].options.body))
    expect(teamBody).toMatchObject({
      from: 'Gauvis <enquiries@notifications.example.com>',
      to: 'team@example.com',
      reply_to: 'thandi@example.com',
    })
    expect(customerBody).toMatchObject({
      from: 'Gauvis <enquiries@notifications.example.com>',
      to: 'thandi@example.com',
      reply_to: 'team@example.com',
    })
    expect(customerBody.text).toContain('Hardware Support')
    expect(customerBody.text).toContain(enquiry.message)
    expect(teamBody.html).toContain('NEW WEBSITE ENQUIRY')
    expect(customerBody.html).toContain('received your enquiry')
    expect(customerBody.html).toContain('cid:gauvis-tech-logo')
    expect(customerBody.attachments[0]).toMatchObject({
      filename: 'gauvis-email-logo.png',
      content_id: 'gauvis-tech-logo',
      content_type: 'image/png',
    })
    for (const body of [teamBody, customerBody]) {
      expect(body).not.toHaveProperty('cc')
      expect(body).not.toHaveProperty('bcc')
    }
  })

  it('does not let the SDK log raw provider errors outside production', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const sensitive = `${environment.RESEND_API_KEY} ${enquiry.email} ${enquiry.message}`
    vi.stubGlobal('fetch', async () => Response.json({ name: 'validation_error', message: sensitive }, { status: 422 }))

    await expect(createConfiguredResendNotifier(environment)!.notify(enquiry)).rejects.toThrow(
      'Enquiry notification could not be delivered.',
    )
    expect(logged).not.toHaveBeenCalled()
  })

  it.each(['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'RESEND_TO_EMAIL'] as const)(
    'disables notifications without %s and does not construct a transport',
    (key) => {
      for (const value of [undefined, '', '   ']) {
        let constructed = false
        const notifier = createConfiguredResendNotifier({ ...environment, [key]: value }, () => {
          constructed = true
          return { async send() { return { error: null } } }
        })
        expect(notifier).toBeNull()
        expect(constructed).toBe(false)
      }
    },
  )

  it('sends both message variants to the team and a separate customer receipt', async () => {
    const sent: NotificationEmail[] = []
    const keys: string[] = []
    const notifier = createConfiguredResendNotifier(environment, (key) => {
      keys.push(key)
      return { async send(input) { sent.push(input); return { error: null } } }
    })

    await notifier!.notify(enquiry)

    expect(keys).toEqual(['re_test_notification_key'])
    expect(sent).toHaveLength(2)
    expect(sent[0]).toMatchObject({
      from: 'Gauvis <enquiries@notifications.example.com>',
      to: 'team@example.com',
      replyTo: 'thandi@example.com',
    })
    expect(sent[0].subject).toContain('New Website Enquiry')
    for (const value of [
      'Thandi Ndlovu', 'Ndlovu Trading', 'thandi@example.com', '+27 84 123 4567',
      'Hardware Support', 'Cape Town', 'Please help replace three computers.',
      'We need setup too.', '2026-10-16T10:30:00.000Z',
    ]) {
      expect(sent[0].text).toContain(value)
      expect(sent[0].html).toContain(value)
    }
    expect(JSON.stringify(sent)).not.toContain(environment.RESEND_API_KEY)
    expect(sent[1]).toMatchObject({
      from: 'Gauvis <enquiries@notifications.example.com>',
      to: 'thandi@example.com',
      replyTo: 'team@example.com',
    })
    expect(sent[1].text).toContain('Hello Thandi')
    expect(sent[1].text).toContain(enquiry.message)
    expect(sent[0].attachments?.[0].contentId).toBe('gauvis-tech-logo')
    expect(sent[1].html).toContain('received your enquiry')
    expect(sent[1].attachments?.[0].contentId).toBe('gauvis-tech-logo')
  })

  it('escapes all user text in HTML, including script tags, ampersands, and both quote types', async () => {
    const sent: NotificationEmail[] = []
    const notifier = createConfiguredResendNotifier(environment, () => ({
      async send(input) { sent.push(input); return { error: null } },
    }))

    await notifier!.notify({
      ...enquiry,
      fullName: '<script>alert("name")</script>',
      businessName: 'A&B <"business">',
      location: "<town> 'quote' & suburb",
      message: '<img src=x onerror="alert(1)">\nIt\'s <urgent> & "important".',
    })

    expect(sent[0].html).toContain('&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;')
    expect(sent[0].html).toContain('A&amp;B &lt;&quot;business&quot;&gt;')
    expect(sent[0].html).toContain('&lt;town&gt; &#39;quote&#39; &amp; suburb')
    expect(sent[0].html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(sent[0].html).toContain('It&#39;s &lt;urgent&gt; &amp; &quot;important&quot;.')
    expect(sent[0].html).not.toMatch(/<script|<town>|<urgent>|<img src=x/)
    expect(sent[0].text).toContain('<script>alert("name")</script>')
    expect(sent[1].html).toContain('&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;')
    expect(sent[1].html).not.toContain('<script>')
    expect(sent[1].html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
  })

  it('keeps the subject on one line when a contact name contains line breaks', async () => {
    const sent: NotificationEmail[] = []
    const notifier = createConfiguredResendNotifier(environment, () => ({
      async send(input) { sent.push(input); return { error: null } },
    }))
    await notifier!.notify({ ...enquiry, fullName: 'Thandi\r\nBcc: other@example.com' })
    expect(sent[0].subject).not.toMatch(/[\r\n]/)
  })

  it('attempts the customer receipt even if the team email fails', async () => {
    const sent: NotificationEmail[] = []
    const notifier = createConfiguredResendNotifier(environment, () => ({
      async send(input) {
        sent.push(input)
        return { error: input.to === 'team@example.com' ? { message: 'provider failure' } : null }
      },
    }))

    await expect(notifier!.notify(enquiry)).rejects.toThrow('Enquiry notification could not be delivered.')
    expect(sent.map((email) => email.to)).toEqual(['team@example.com', 'thandi@example.com'])
  })

  it('alerts only the configured team about a successful admin sign-in without credentials', async () => {
    const sent: NotificationEmail[] = []
    const notifier = createConfiguredResendNotifier(environment, () => ({
      async send(input) { sent.push(input); return { error: null } },
    }))

    await notifier!.notifyAdminLogin({ at: new Date('2026-10-17T08:00:00.000Z'), username: 'admin' })

    expect(sent).toHaveLength(1)
    expect(sent[0].to).toBe('team@example.com')
    expect(sent[0].text).toContain('2026-10-17T08:00:00.000Z')
    expect(sent[0].text).toContain('admin')
    expect(sent[0].html).toContain('A sign-in to your dashboard.')
    expect(sent[0].attachments?.[0].contentType).toBe('image/png')
    expect(JSON.stringify(sent[0])).not.toMatch(/correct horse|scrypt\$|JWT_SECRET_KEY|re_test_notification_key/)
  })

  it('uses ADMIN_EMAIL in preference to the legacy recipient variable and rejects unsafe recipients', async () => {
    const sent: NotificationEmail[] = []
    const configured = createConfiguredResendNotifier({ ...environment, ADMIN_EMAIL: 'owner@example.com' }, () => ({
      async send(input) { sent.push(input); return { error: null } },
    }))

    await configured!.notifyAdminLogin({ at: new Date('2026-10-17T08:00:00.000Z'), username: 'admin' })
    expect(sent[0].to).toBe('owner@example.com')

    expect(createConfiguredResendNotifier({ ...environment, ADMIN_EMAIL: 'owner@example.com\r\nBcc: attacker@example.com' })).toBeNull()
  })

  it('does not expose provider details if the admin sign-in alert fails', async () => {
    const notifier = createConfiguredResendNotifier(environment, () => ({
      async send() { throw new Error(`${environment.RESEND_API_KEY} secret`) },
    }))

    await expect(notifier!.notifyAdminLogin({ at: new Date('2026-10-17T08:00:00.000Z'), username: 'admin' })).rejects.toMatchObject({
      message: 'Admin sign-in notification could not be delivered.',
    })
  })

  it.each(['provider response', 'thrown exception'])(
    'replaces a %s failure with a generic error without sensitive details',
    async (mode) => {
      const sensitive = `${environment.RESEND_API_KEY} ${enquiry.email} ${enquiry.phone} ${enquiry.message}`
      const notifier = createConfiguredResendNotifier(environment, () => ({
        async send() {
          if (mode === 'thrown exception') throw new Error(sensitive)
          return { error: { name: 'provider_error', message: sensitive } }
        },
      }))

      await expect(notifier!.notify(enquiry)).rejects.toMatchObject({
        message: 'Enquiry notification could not be delivered.',
      })
      try {
        await notifier!.notify(enquiry)
      } catch (error) {
        expect(String(error)).not.toContain(environment.RESEND_API_KEY)
        expect(String(error)).not.toContain(enquiry.email)
        expect(String(error)).not.toContain(enquiry.message)
        expect(error).not.toHaveProperty('cause')
      }
    },
  )
})
