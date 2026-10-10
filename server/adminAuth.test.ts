// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  clearSessionCookie,
  createAdminToken,
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
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('Max-Age=900')
    expect(clearSessionCookie(true)).toContain('Max-Age=0')
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
