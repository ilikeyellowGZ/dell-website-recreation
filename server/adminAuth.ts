import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { jwtVerify, SignJWT, type JWTPayload } from 'jose'

const scrypt = promisify(scryptCallback)
const cookieName = 'gauvis_admin_session'
const issuer = 'gauvis-tech'
const audience = 'gauvis-admin'
const sessionLifetimeSeconds = 15 * 60

function getSecretKey(secret: string) {
  const key = Buffer.from(secret, 'base64url')
  if (key.length < 32) throw new Error('JWT_SECRET_KEY must contain at least 32 bytes.')
  return key
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 16) throw new Error('Admin passwords must contain at least 16 characters.')
  const salt = randomBytes(16)
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, saltValue, hashValue, extra] = encodedHash.split('$')
  if (algorithm !== 'scrypt' || !saltValue || !hashValue || extra) return false

  try {
    const salt = Buffer.from(saltValue, 'base64url')
    const expected = Buffer.from(hashValue, 'base64url')
    if (salt.length !== 16 || expected.length !== 64) return false
    const actual = (await scrypt(password, salt, expected.length)) as Buffer
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function generateAdminPassword(): string {
  return randomBytes(24).toString('base64url')
}

export function generateJwtSecret(): string {
  return randomBytes(32).toString('base64url')
}

export async function createAdminToken(subject: string, secret: string, sessionId = randomBytes(24).toString('base64url')): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(audience)
    .setJti(sessionId)
    .setIssuedAt()
    .setExpirationTime(`${sessionLifetimeSeconds}s`)
    .sign(getSecretKey(secret))
}

export async function verifyAdminToken(token: string, secret: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(secret), {
    algorithms: ['HS256'],
    audience,
    issuer,
  })
  if (payload.role !== 'admin' || !payload.sub || !payload.jti) throw new Error('Invalid admin session.')
  return payload
}

export const adminIdleTimeoutMs = sessionLifetimeSeconds * 1_000

export type AdminSessionStore = {
  create(sessionId: string, now: number): Promise<void>
  isActive(sessionId: string, now: number): Promise<boolean>
  touch(sessionId: string, now: number): Promise<boolean>
  revoke(sessionId: string): Promise<void>
}

export function createMemoryAdminSessionStore(idleTimeoutMs = adminIdleTimeoutMs): AdminSessionStore {
  const sessions = new Map<string, number>()
  const active = (sessionId: string, now: number) => {
    const lastActivityAt = sessions.get(sessionId)
    if (lastActivityAt === undefined || now - lastActivityAt >= idleTimeoutMs) {
      sessions.delete(sessionId)
      return false
    }
    return true
  }
  return {
    async create(sessionId, now) { sessions.set(sessionId, now) },
    async isActive(sessionId, now) { return active(sessionId, now) },
    async touch(sessionId, now) {
      if (!active(sessionId, now)) return false
      sessions.set(sessionId, now)
      return true
    },
    async revoke(sessionId) { sessions.delete(sessionId) },
  }
}

export type CookieSameSite = 'None' | 'Strict'

function getCookieSettings(isProduction: boolean, sameSite?: CookieSameSite) {
  const secure = isProduction ? '; Secure' : ''
  return { sameSite: sameSite ?? (isProduction ? 'None' : 'Strict'), secure }
}

export function getSessionCookie(token: string, isProduction: boolean, sameSite?: CookieSameSite): string {
  const settings = getCookieSettings(isProduction, sameSite)
  return `${cookieName}=${token}; Path=/api/admin; HttpOnly; SameSite=${settings.sameSite}; Max-Age=${sessionLifetimeSeconds}${settings.secure}`
}

export function clearSessionCookie(isProduction: boolean, sameSite?: CookieSameSite): string {
  const settings = getCookieSettings(isProduction, sameSite)
  return `${cookieName}=; Path=/api/admin; HttpOnly; SameSite=${settings.sameSite}; Max-Age=0${settings.secure}`
}

export function readSessionCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null
  for (const item of cookieHeader.split(';')) {
    const [name, ...valueParts] = item.trim().split('=')
    if (name === cookieName) return valueParts.join('=') || null
  }
  return null
}
