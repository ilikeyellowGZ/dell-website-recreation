// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { renderAdminLoginAlert, renderCustomerReceipt } from './emailTemplates'

describe('branded transactional email templates', () => {
  it('renders an escaped, branded customer receipt with an inline PNG logo', () => {
    const receipt = renderCustomerReceipt({
      fullName: '<img src=x onerror="alert(1)">',
      service: 'Hardware Support',
      message: 'Please help replace three computers.',
      reference: 'GVT-20261017-ABCDEF123456',
    })

    expect(receipt.subject).toContain("We've Received Your Enquiry")
    expect(receipt.text).toContain('received your enquiry')
    expect(receipt.text).toContain('Hardware Support')
    expect(receipt.text).toContain('GVT-20261017-ABCDEF123456')
    expect(receipt.html).toContain('ENQUIRY RECEIVED')
    expect(receipt.html).toContain('received your enquiry')
    expect(receipt.html).toContain('cid:gauvis-tech-logo')
    expect(receipt.html).toContain('alt="Gauvis Tech"')
    expect(receipt.html).toContain('<table')
    expect(receipt.html).toContain('#0b2c55')
    expect(receipt.html).toContain('#f15a29')
    expect(receipt.html).toContain('Hello &lt;img,')
    expect(receipt.html).not.toContain('<img src=x onerror=')
    expect(receipt.html).toContain('Gauvis Tech</td>')
    expect(receipt.html).toContain('Please help replace three computers.')
    expect(receipt.attachments).toHaveLength(1)
    expect(receipt.attachments[0]).toMatchObject({
      filename: 'gauvis-email-logo.png',
      contentId: 'gauvis-tech-logo',
      contentType: 'image/png',
    })
    expect(receipt.attachments[0].content.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  })

  it('renders a purpose-specific admin sign-in alert with UTC time and no credentials', () => {
    const alert = renderAdminLoginAlert({ at: new Date('2026-10-17T08:00:00.000Z'), username: 'admin' })

    expect(alert.subject).toContain('Admin Login Alert')
    expect(alert.text).toContain('A sign-in to your dashboard.')
    expect(alert.text).toContain('2026-10-17T08:00:00.000Z')
    expect(alert.text).toContain('admin')
    expect(alert.text).toContain('If this was you, no action is needed.')
    expect(alert.html).toContain('SECURITY NOTICE')
    expect(alert.html).toContain('A sign-in to your dashboard.')
    expect(alert.html).toContain('cid:gauvis-tech-logo')
    expect(alert.attachments[0].contentId).toBe('gauvis-tech-logo')
    expect(`${alert.text} ${alert.html}`).not.toMatch(/password:|token:|sign-in link/i)
  })
})
