// @vitest-environment node

import type { Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from './app'
import type { Enquiry, EnquiryRepository } from './enquiryRepository'

const validPayload = {
  fullName: '  Thandi Ndlovu  ',
  businessName: 'Ndlovu Trading',
  email: 'THANDI@example.com',
  phone: '+27 84 123 4567',
  service: 'Hardware Support',
  location: 'Cape Town',
  message: 'Please help us replace three office computers.',
  consent: true,
  website: '',
}

const servers: Server[] = []

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
        }),
    ),
  )
})

async function start(repository: EnquiryRepository | null) {
  const server = createApp({ enquiryRepository: repository }).listen(0)
  servers.push(server)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected a TCP server address')
  return `http://127.0.0.1:${address.port}`
}

describe('POST /api/enquiries', () => {
  it('validates, normalizes, and stores an accepted website enquiry', async () => {
    const stored: Enquiry[] = []
    const baseUrl = await start({
      async insert(enquiry) {
        stored.push(enquiry)
      },
    })

    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ accepted: true })
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({
      fullName: 'Thandi Ndlovu',
      businessName: 'Ndlovu Trading',
      email: 'thandi@example.com',
      phone: '+27 84 123 4567',
      service: 'Hardware Support',
      location: 'Cape Town',
      message: 'Please help us replace three office computers.',
      consent: true,
      source: 'website',
      status: 'new',
    })
    expect(stored[0].createdAt).toBeInstanceOf(Date)
  })

  it('rejects invalid fields before they reach the repository', async () => {
    const stored: Enquiry[] = []
    const baseUrl = await start({
      async insert(enquiry) {
        stored.push(enquiry)
      },
    })

    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validPayload, email: 'not-an-email', consent: false }),
    })
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body).toMatchObject({
      accepted: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: {
        email: expect.any(String),
        consent: expect.any(String),
      },
    })
    expect(stored).toHaveLength(0)
  })

  it('silently accepts honeypot submissions without storing them', async () => {
    const stored: Enquiry[] = []
    const baseUrl = await start({
      async insert(enquiry) {
        stored.push(enquiry)
      },
    })

    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validPayload, website: 'https://spam.example' }),
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ accepted: true })
    expect(stored).toHaveLength(0)
  })

  it('returns an unavailable response without exposing repository errors', async () => {
    const baseUrl = await start({
      async insert() {
        throw new Error('mongodb://user:secret@internal.example/gauvis')
      },
    })

    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    })
    const bodyText = await response.text()

    expect(response.status).toBe(503)
    expect(JSON.parse(bodyText)).toEqual({
      accepted: false,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Enquiry delivery is temporarily unavailable. Please try again or contact us by phone.',
    })
    expect(bodyText).not.toContain('mongodb://')
    expect(bodyText).not.toContain('secret')
  })

  it('returns a clear unavailable response when MongoDB is not configured', async () => {
    const baseUrl = await start(null)

    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    })

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      accepted: false,
      code: 'SERVICE_UNAVAILABLE',
    })
  })

  it('rejects request bodies larger than 32 KiB', async () => {
    const baseUrl = await start({ async insert() {} })

    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validPayload, message: 'x'.repeat(34 * 1024) }),
    })

    expect(response.status).toBe(413)
    expect(await response.json()).toEqual({
      accepted: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'The enquiry is too large to submit.',
    })
  })
})
