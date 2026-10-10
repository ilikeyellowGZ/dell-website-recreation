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

export async function createAdminToken(subject: string, secret: string): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(audience)
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
  if (payload.role !== 'admin' || !payload.sub) throw new Error('Invalid admin session.')
  return payload
}

export function getSessionCookie(token: string, isProduction: boolean): string {
  const secure = isProduction ? '; Secure' : ''
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetimeSeconds}${secure}`
}

export function clearSessionCookie(isProduction: boolean): string {
  const secure = isProduction ? '; Secure' : ''
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
}

export function readSessionCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null
  for (const item of cookieHeader.split(';')) {
    const [name, ...valueParts] = item.trim().split('=')
    if (name === cookieName) return valueParts.join('=') || null
  }
  return null
}
