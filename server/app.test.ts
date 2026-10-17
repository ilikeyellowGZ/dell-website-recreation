// @vitest-environment node

import type { Server } from 'node:http'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateJwtSecret, hashPassword } from './adminAuth'
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
const temporaryDirectories: string[] = []

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
        }),
    ),
  )
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

async function start(
  repository: EnquiryRepository | null,
  staticDirectory?: string,
  options: Omit<Parameters<typeof createApp>[0], 'enquiryRepository' | 'staticDirectory'> = {},
) {
  const server = createApp({ ...options, enquiryRepository: repository, staticDirectory }).listen(0)
  servers.push(server)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected a TCP server address')
  return `http://127.0.0.1:${address.port}`
}

describe('split-origin API security', () => {
  const frontendOrigin = 'https://gauvis.example'

  async function startSplitApp(repository: EnquiryRepository | null = null, withAdmin = false) {
    const server = createApp({
      allowedOrigins: new Set([frontendOrigin]),
      enquiryRepository: repository,
      admin: withAdmin ? {
        isProduction: true,
        jwtSecret: generateJwtSecret(),
        passwordHash: await hashPassword('correct horse battery staple'),
        username: 'admin',
      } : null,
    }).listen(0)
    servers.push(server)
    await new Promise<void>((resolve) => server.once('listening', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected a TCP server address')
    return `http://127.0.0.1:${address.port}`
  }

  function expectCredentialedCors(response: Response) {
    expect(response.headers.get('access-control-allow-origin')).toBe(frontendOrigin)
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    expect(response.headers.get('vary')?.split(/,\s*/)).toContain('Origin')
  }

  it('permits exact credentialed API preflight with the minimum methods and headers', async () => {
    const baseUrl = await startSplitApp()
    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'OPTIONS',
      headers: { origin: frontendOrigin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' },
    })

    expect(response.status).toBe(204)
    expectCredentialedCors(response)
    expect(response.headers.get('access-control-allow-methods')).toBe('GET,POST,OPTIONS')
    expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type')
    expect(await response.text()).toBe('')
  })

  it('provides no CORS permission for an unapproved preflight or non-API route', async () => {
    const baseUrl = await startSplitApp()
    for (const [path, origin] of [['/api/enquiries', 'https://evil.example'], ['/contact', frontendOrigin]]) {
      const response = await fetch(`${baseUrl}${path}`, { method: 'OPTIONS', headers: { origin } })
      expect(response.headers.get('access-control-allow-origin')).toBeNull()
      expect(response.headers.get('access-control-allow-credentials')).toBeNull()
      if (path.startsWith('/api/')) expect(response.status).toBe(403)
    }
  })

  it('rejects absent and non-exact origins before storage, while accepting the configured frontend', async () => {
    const stored: Enquiry[] = []
    const baseUrl = await startSplitApp({ async insert(enquiry) { stored.push(enquiry) } })
    for (const origin of [undefined, 'null', 'https://evil.example', 'https://gauvis.example.evil', 'http://gauvis.example', `${frontendOrigin}/path`, baseUrl]) {
      const response = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
        body: JSON.stringify(validPayload),
      })
      expect(response.status, `origin ${origin}`).toBe(403)
      expect(response.headers.get('access-control-allow-origin')).toBeNull()
      expect(stored).toHaveLength(0)
    }

    const accepted = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: frontendOrigin },
      body: JSON.stringify(validPayload),
    })
    expect(accepted.status).toBe(201)
    expectCredentialedCors(accepted)
    expect(stored).toHaveLength(1)
  })

  it('supports production login, authenticated reads, and logout from the configured frontend', async () => {
    const baseUrl = await startSplitApp({ async insert() {}, async listRecent() { return [] } }, true)
    const login = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: frontendOrigin },
      body: JSON.stringify({ username: 'admin', password: 'correct horse battery staple' }),
    })
    expect(login.status).toBe(200)
    expectCredentialedCors(login)
    expect(login.headers.get('set-cookie')).toContain('Path=/api/admin; HttpOnly; SameSite=None; Max-Age=900; Secure')
    const cookie = login.headers.get('set-cookie')!.split(';')[0]

    for (const path of ['/api/admin/session', '/api/admin/enquiries']) {
      const response = await fetch(`${baseUrl}${path}`, { headers: { origin: frontendOrigin, cookie } })
      expect(response.status).toBe(200)
      expectCredentialedCors(response)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(await response.json()).toEqual(path.endsWith('/session') ? { authenticated: true } : { enquiries: [] })
    }

    const unapprovedRead = await fetch(`${baseUrl}/api/admin/session`, { headers: { origin: 'https://evil.example', cookie } })
    expect(unapprovedRead.headers.get('access-control-allow-origin')).toBeNull()
    expect(unapprovedRead.headers.get('access-control-allow-credentials')).toBeNull()

    const logout = await fetch(`${baseUrl}/api/admin/logout`, { method: 'POST', headers: { origin: frontendOrigin, cookie } })
    expect(logout.status).toBe(204)
    expectCredentialedCors(logout)
    expect(logout.headers.get('set-cookie')).toBe('gauvis_admin_session=; Path=/api/admin; HttpOnly; SameSite=None; Max-Age=0; Secure')
  })

  it('alerts the team only after a successful admin sign-in and keeps login working if email fails', async () => {
    const alerts: { at: Date; username: string }[] = []
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const baseUrl = await start(null, undefined, {
      admin: {
        isProduction: false,
        jwtSecret: generateJwtSecret(),
        passwordHash: await hashPassword('correct horse battery staple'),
        username: 'admin',
      },
      adminLoginNotifier: {
        async notifyAdminLogin(alert) {
          alerts.push(alert)
          throw new Error('re_secret customer@example.com')
        },
      },
    })

    const signIn = (password: string) => fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseUrl },
      body: JSON.stringify({ username: 'admin', password }),
    })

    expect((await signIn('wrong password')).status).toBe(401)
    expect(alerts).toHaveLength(0)
    const accepted = await signIn('correct horse battery staple')
    expect(accepted.status).toBe(200)
    expect(accepted.headers.get('set-cookie')).toContain('gauvis_admin_session=')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ username: 'admin' })
    expect(alerts[0].at).toBeInstanceOf(Date)
    expect(JSON.stringify(logged.mock.calls)).not.toContain('re_secret')
    expect(JSON.stringify(logged.mock.calls)).not.toContain('customer@example.com')
  })

  it('suppresses repeated successful-login alerts during the configured cooldown without blocking sign-in', async () => {
    const alerts: { at: Date; username: string }[] = []
    let now = new Date('2026-10-17T08:00:00.000Z')
    const baseUrl = await start(null, undefined, {
      admin: {
        isProduction: false,
        jwtSecret: generateJwtSecret(),
        passwordHash: await hashPassword('correct horse battery staple'),
        username: 'admin',
      },
      adminLoginNotificationCooldownMs: 60_000,
      adminLoginNotifier: { async notifyAdminLogin(alert) { alerts.push(alert) } },
      clock: () => now,
    })
    const signIn = () => fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseUrl },
      body: JSON.stringify({ username: 'admin', password: 'correct horse battery staple' }),
    })

    expect((await signIn()).status).toBe(200)
    expect((await signIn()).status).toBe(200)
    expect(alerts).toEqual([{ at: now, username: 'admin' }])

    now = new Date('2026-10-17T08:01:00.001Z')
    expect((await signIn()).status).toBe(200)
    expect(alerts).toHaveLength(2)
    expect(alerts[1]).toEqual({ at: now, username: 'admin' })
  })

  it('rejects login and logout from absent, foreign, and API-host origins without setting cookies', async () => {
    const baseUrl = await startSplitApp(null, true)
    for (const path of ['/api/admin/login', '/api/admin/logout']) {
      for (const origin of [undefined, 'https://evil.example', baseUrl]) {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
          body: JSON.stringify({ username: 'admin', password: 'correct horse battery staple' }),
        })
        expect(response.status).toBe(403)
        expect(response.headers.get('set-cookie')).toBeNull()
        expect(response.headers.get('access-control-allow-origin')).toBeNull()
      }
    }
  })

  it('exposes only process responsiveness through the public health check', async () => {
    const baseUrl = await startSplitApp()
    const response = await fetch(`${baseUrl}/api/health`)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })
})

describe('same-origin Worker API security', () => {
  it('leaves login throttling to the Worker limiter instead of the bridged Express request', async () => {
    const baseUrl = await start(null, undefined, {
      admin: {
        isProduction: true,
        cookieSameSite: 'Strict',
        jwtSecret: generateJwtSecret(),
        passwordHash: await hashPassword('correct horse battery staple'),
        username: 'admin',
      },
      sameOriginOnly: true,
      workerManagedRateLimits: true,
    })

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: baseUrl },
        body: JSON.stringify({}),
      })
      expect(response.status).toBe(401)
    }
  })

  it('rejects cross-site writes while issuing a strict secure cookie for the combined deployment', async () => {
    const stored: Enquiry[] = []
    const baseUrl = await start({ async insert(enquiry) { stored.push(enquiry) } }, undefined, {
      admin: {
        isProduction: true,
        cookieSameSite: 'Strict',
        jwtSecret: generateJwtSecret(),
        passwordHash: await hashPassword('correct horse battery staple'),
        username: 'admin',
      },
      sameOriginOnly: true,
    })

    const foreignEnquiry = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify(validPayload),
    })
    expect(foreignEnquiry.status).toBe(403)
    expect(stored).toHaveLength(0)
    expect(foreignEnquiry.headers.get('access-control-allow-origin')).toBeNull()

    const login = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseUrl },
      body: JSON.stringify({ username: 'admin', password: 'correct horse battery staple' }),
    })
    expect(login.status).toBe(200)
    expect(login.headers.get('set-cookie')).toContain('SameSite=Strict; Max-Age=900; Secure')

    const authAlias = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseUrl },
      body: JSON.stringify({ username: 'admin', password: 'correct horse battery staple' }),
    })
    expect(authAlias.status).toBe(200)
    expect(authAlias.headers.get('set-cookie')).toContain('SameSite=Strict; Max-Age=900; Secure')
  })
})

describe('Production static assets', () => {
  it('compresses text assets and gives hashed assets an immutable cache policy', async () => {
    const staticDirectory = await mkdtemp(join(tmpdir(), 'gauvis-static-'))
    temporaryDirectories.push(staticDirectory)
    await mkdir(join(staticDirectory, 'assets'))
    await writeFile(join(staticDirectory, 'index.html'), '<!doctype html><title>Gauvis</title>')
    await writeFile(join(staticDirectory, 'assets', 'app-abc123.css'), 'body { color: navy; }\n'.repeat(1_000))
    const baseUrl = await start(null, staticDirectory)

    const response = await fetch(`${baseUrl}/assets/app-abc123.css`, {
      headers: { 'accept-encoding': 'gzip' },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-encoding')).toBe('gzip')
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
  })
})

describe('POST /api/enquiries', () => {
  it('rejects collection when production enquiries are disabled', async () => {
    const stored: Enquiry[] = []
    const server = createApp({
      enquiriesEnabled: false,
      enquiryRepository: {
        async insert(enquiry) {
          stored.push(enquiry)
        },
      },
    }).listen(0)
    servers.push(server)
    await new Promise<void>((resolve) => server.once('listening', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected a TCP server address')

    const response = await fetch(`http://127.0.0.1:${address.port}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    })

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      accepted: false,
      code: 'ENQUIRIES_DISABLED',
    })
    expect(stored).toHaveLength(0)
  })

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

  it('rejects unexpected fields before they reach the repository', async () => {
    const stored: Enquiry[] = []
    const baseUrl = await start({ async insert(enquiry) { stored.push(enquiry) } })

    const response = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validPayload, unexpected: 'not accepted' }),
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ accepted: false, code: 'VALIDATION_ERROR' })
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

describe('stored enquiry notifications', () => {
  const postEnquiry = (baseUrl: string, payload = validPayload) => fetch(`${baseUrl}/api/enquiries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })

  it('stores exactly once before notifying with the normalized stored enquiry', async () => {
    const events: string[] = []
    const stored: Enquiry[] = []
    const notifications: Enquiry[] = []
    const baseUrl = await start({
      async insert(enquiry) {
        await Promise.resolve()
        stored.push(enquiry)
        events.push('stored')
      },
    }, undefined, {
      enquiryNotifier: {
        async notify(enquiry) {
          notifications.push(enquiry)
          events.push('emailed')
        },
      },
    })

    const response = await postEnquiry(baseUrl)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ accepted: true })
    expect(events).toEqual(['stored', 'emailed'])
    expect(stored).toHaveLength(1)
    expect(notifications).toHaveLength(1)
    expect(notifications[0]).toBe(stored[0])
    expect(notifications[0]).toMatchObject({
      fullName: 'Thandi Ndlovu', email: 'thandi@example.com', source: 'website', status: 'new',
    })
    expect(notifications[0]).not.toHaveProperty('website')
  })

  it('still accepts one stored enquiry after notification rejection and logs no sensitive values', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stored: Enquiry[] = []
    const notifications: Enquiry[] = []
    const baseUrl = await start({ async insert(enquiry) { stored.push(enquiry) } }, undefined, {
      enquiryNotifier: {
        async notify(enquiry) {
          notifications.push(enquiry)
          const error = new Error(`re_sensitive_test_key ${enquiry.email} ${enquiry.phone} ${enquiry.message}`)
          error.name = enquiry.message
          throw error
        },
      },
    })

    const response = await postEnquiry(baseUrl)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ accepted: true })
    expect(stored).toHaveLength(1)
    expect(notifications).toHaveLength(1)
    expect(logged).toHaveBeenCalledTimes(1)
    expect(logged.mock.calls[0][0]).toBe('Enquiry notification failed after storage.')
    const logText = JSON.stringify(logged.mock.calls)
    for (const sensitive of [
      're_sensitive_test_key', 'thandi@example.com', validPayload.phone, validPayload.message,
    ]) expect(logText).not.toContain(sensitive)
  })

  it.each([
    { name: 'validation rejection', payload: { ...validPayload, email: 'invalid' }, status: 422 },
    { name: 'honeypot', payload: { ...validPayload, website: 'spam' }, status: 201 },
    { name: 'disabled enquiries', enabled: false, status: 503 },
    { name: 'missing repository', missingRepository: true, status: 503 },
    { name: 'failed storage', storageFailure: true, status: 503 },
    { name: 'rejected origin', originRestricted: true, status: 403 },
    { name: 'oversized payload', payload: { ...validPayload, message: 'x'.repeat(34 * 1024) }, status: 413 },
  ])('does not notify after $name', async (scenario) => {
    const notifications: Enquiry[] = []
    const stored: Enquiry[] = []
    const baseUrl = await start(scenario.missingRepository ? null : {
      async insert(enquiry) {
        if (scenario.storageFailure) throw new Error('database failure')
        stored.push(enquiry)
      },
    }, undefined, {
      enquiriesEnabled: scenario.enabled ?? true,
      allowedOrigins: new Set(scenario.originRestricted ? ['https://gauvis.example'] : []),
      enquiryNotifier: { async notify(enquiry) { notifications.push(enquiry) } },
    })

    const response = await postEnquiry(baseUrl, scenario.payload ?? validPayload)

    expect(response.status).toBe(scenario.status)
    expect(stored).toHaveLength(0)
    expect(notifications).toHaveLength(0)
  })

  it('does not store or notify when the existing enquiry rate limit is reached', async () => {
    const events: string[] = []
    const baseUrl = await start({ async insert() { events.push('stored') } }, undefined, {
      enquiryNotifier: { async notify() { events.push('emailed') } },
    })
    for (let index = 0; index < 5; index++) {
      expect((await postEnquiry(baseUrl)).status).toBe(201)
    }
    const limited = await postEnquiry(baseUrl)
    expect(limited.status).toBe(429)
    expect(await limited.json()).toMatchObject({ accepted: false, code: 'RATE_LIMITED' })
    expect(events).toEqual(Array.from({ length: 5 }, () => ['stored', 'emailed']).flat())
  })
})

describe('admin enquiry API', () => {
  const storedEnquiry: Enquiry = {
    businessName: 'Ndlovu Trading',
    consent: true,
    createdAt: new Date('2026-10-10T08:00:00.000Z'),
    email: 'thandi@example.com',
    fullName: 'Thandi Ndlovu',
    location: 'Cape Town',
    message: 'Please help us replace three office computers.',
    phone: '+27 84 123 4567',
    service: 'Hardware Support',
    source: 'website',
    status: 'new',
  }

  async function startAdminApp() {
    const passwordHash = await hashPassword('correct horse battery staple')
    const requestedLimits: number[] = []
    const server = createApp({
      admin: {
        isProduction: false,
        jwtSecret: generateJwtSecret(),
        passwordHash,
        username: 'admin',
      },
      enquiryRepository: {
        async insert() {},
        async listRecent(limit) {
          requestedLimits.push(limit)
          return [storedEnquiry]
        },
      },
    }).listen(0)
    servers.push(server)
    await new Promise<void>((resolve) => server.once('listening', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected a TCP server address')
    return { baseUrl: `http://127.0.0.1:${address.port}`, requestedLimits }
  }

  it('rejects an enquiry list request without an admin session', async () => {
    const { baseUrl } = await startAdminApp()

    const response = await fetch(`${baseUrl}/api/admin/enquiries`)

    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ authenticated: false })
  })

  it('sets a protected session and returns a bounded enquiry list', async () => {
    const { baseUrl, requestedLimits } = await startAdminApp()
    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseUrl },
      body: JSON.stringify({ username: 'admin', password: 'correct horse battery staple' }),
    })
    const cookie = loginResponse.headers.get('set-cookie')

    expect(loginResponse.status).toBe(200)
    expect(cookie).toContain('gauvis_admin_session=')
    expect(cookie).toContain('HttpOnly')

    const response = await fetch(`${baseUrl}/api/admin/enquiries`, {
      headers: { cookie: cookie!.split(';')[0] },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ enquiries: [{ ...storedEnquiry, createdAt: '2026-10-10T08:00:00.000Z' }] })
    expect(requestedLimits).toEqual([100])
  })

  it('does not reveal which login credential was incorrect', async () => {
    const { baseUrl } = await startAdminApp()

    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseUrl },
      body: JSON.stringify({ username: 'admin', password: 'wrong password' }),
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ authenticated: false, message: 'Sign-in failed.' })
  })

  it('clears the admin session on logout', async () => {
    const { baseUrl } = await startAdminApp()

    const response = await fetch(`${baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: { origin: baseUrl },
    })

    expect(response.status).toBe(204)
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })
})
