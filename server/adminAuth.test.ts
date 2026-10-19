// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  clearSessionCookie,
  createAdminToken,
  createMemoryAdminSessionStore,
  generateAdminPassword,
  generateJwtSecret,
  getSessionCookie,
  hashPassword,
  verifyAdminToken,
  verifyPassword,
} from './adminAuth'

describe('admin password protection', () => {
  it('accepts only the password used to create the scrypt hash', async () => {
    const encodedHash = await hashPassword('correct horse battery staple')

    expect(encodedHash).toMatch(/^scrypt\$/)
    expect(await verifyPassword('correct horse battery staple', encodedHash)).toBe(true)
    expect(await verifyPassword('wrong password', encodedHash)).toBe(false)
  })

  it('rejects malformed stored hashes without throwing', async () => {
    expect(await verifyPassword('anything', 'not-a-valid-hash')).toBe(false)
  })
})

describe('admin JWT session', () => {
  it('round-trips an admin subject through a signed token', async () => {
    const secret = generateJwtSecret()
    const token = await createAdminToken('admin', secret)

    expect((await verifyAdminToken(token, secret)).sub).toBe('admin')
    await expect(verifyAdminToken(`${token}tampered`, secret)).rejects.toThrow()
  })

  it('uses a secure http-only cookie in production', async () => {
    const token = await createAdminToken('admin', generateJwtSecret())
    const cookie = getSessionCookie(token, true)

    expect(cookie).toContain('gauvis_admin_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Path=/api/admin; HttpOnly; SameSite=None; Max-Age=900; Secure')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('Max-Age=900')
    expect(clearSessionCookie(true)).toBe('gauvis_admin_session=; Path=/api/admin; HttpOnly; SameSite=None; Max-Age=0; Secure')
  })

  it('keeps local HTTP sessions strict and clears the same cookie scope', () => {
    expect(getSessionCookie('local-token', false)).toBe('gauvis_admin_session=local-token; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=900')
    expect(clearSessionCookie(false)).toBe('gauvis_admin_session=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0')
  })
})

describe('server-enforced admin idle sessions', () => {
  it('expires after 15 idle minutes, refreshes only when touched, and supports revocation', async () => {
    const sessions = createMemoryAdminSessionStore(15 * 60 * 1_000)
    await sessions.create('session-one', 1_000)
    expect(await sessions.isActive('session-one', 15 * 60 * 1_000)).toBe(true)
    expect(await sessions.touch('session-one', 15 * 60 * 1_000)).toBe(true)
    expect(await sessions.isActive('session-one', 30 * 60 * 1_000 - 1)).toBe(true)
    expect(await sessions.isActive('session-one', 30 * 60 * 1_000)).toBe(false)

    await sessions.create('session-two', 1_000)
    await sessions.revoke('session-two')
    expect(await sessions.isActive('session-two', 1_001)).toBe(false)
  })
})

describe('credential generation', () => {
  it('creates high-entropy URL-safe deployment credentials', () => {
    const password = generateAdminPassword()
    const secret = generateJwtSecret()

    expect(password).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(Buffer.from(secret, 'base64url')).toHaveLength(32)
  })
})
