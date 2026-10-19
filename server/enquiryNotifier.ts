import { Resend } from 'resend'
import type { Enquiry } from './enquiryRepository'
import { renderAdminFailedLoginAlert, renderAdminLoginAlert, renderCustomerReceipt, renderTeamEnquiry, type BrandedEmailContent } from './emailTemplates'

export type EnquiryNotifier = { notify(enquiry: Enquiry): Promise<void> }
export type AdminLoginNotifier = {
  notifyAdminLogin(alert: { at: Date; username: string; ipAddress?: string; userAgent?: string }): Promise<void>
  notifyAdminLoginFailure?(alert: { at: Date; username: string; attempts: number; ipAddress?: string; userAgent?: string }): Promise<void>
}

export type NotificationEmail = {
  from: string
  to: string
  replyTo: string
  subject: string
  text: string
  html: string
  attachments?: BrandedEmailContent['attachments']
}

type EmailTransport = { send(input: NotificationEmail): Promise<{ error?: unknown }> }

function isSafeRecipientAddress(value: string): boolean {
  return !/[\r\n]/.test(value) && /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(value)
}

export function createConfiguredResendNotifier(
  environment: NodeJS.ProcessEnv = process.env,
  createTransport: (apiKey: string) => EmailTransport = (apiKey) => new Resend(apiKey).emails,
): (EnquiryNotifier & AdminLoginNotifier) | null {
  const apiKey = environment.RESEND_API_KEY?.trim()
  const from = environment.RESEND_FROM_EMAIL?.trim()
  const to = environment.COMPANY_NOTIFICATION_EMAIL?.trim() || environment.ADMIN_EMAIL?.trim() || environment.RESEND_TO_EMAIL?.trim()
  if (!apiKey || !from || !to || /[\r\n]/.test(from) || !isSafeRecipientAddress(to)) return null

  const transport = createTransport(apiKey)
  return {
    async notify(enquiry) {
      const teamEmail: NotificationEmail = {
          from,
          to,
          replyTo: enquiry.email,
          ...renderTeamEnquiry(enquiry),
      }
      const customerEmail: NotificationEmail = {
        from,
        to: enquiry.email,
        replyTo: to,
        ...renderCustomerReceipt(enquiry),
      }
      const send = async (email: NotificationEmail) => {
        const result = await transport.send(email)
        if (result.error) throw new Error('Provider rejected the notification.')
      }
      const outcomes = await Promise.allSettled([send(teamEmail), send(customerEmail)])
      if (outcomes.some((outcome) => outcome.status === 'rejected')) {
        // Provider errors can contain credentials and enquiry content; do not retain a cause.
        throw new Error('Enquiry notification could not be delivered.')
      }
    },
    async notifyAdminLogin(alert) {
      try {
        const result = await transport.send({
          from,
          to,
          replyTo: to,
          ...renderAdminLoginAlert(alert),
        })
        if (result.error) throw new Error('Provider rejected the notification.')
      } catch {
        throw new Error('Admin sign-in notification could not be delivered.')
      }
    },
    async notifyAdminLoginFailure(alert) {
      try {
        const result = await transport.send({ from, to, replyTo: to, ...renderAdminFailedLoginAlert(alert) })
        if (result.error) throw new Error('Provider rejected the notification.')
      } catch {
        throw new Error('Admin failed-login notification could not be delivered.')
      }
    },
  }
}
