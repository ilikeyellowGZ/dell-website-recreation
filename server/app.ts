import compression from 'compression'
import express, { type ErrorRequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import {
  adminIdleTimeoutMs,
  clearSessionCookie,
  createAdminToken,
  createMemoryAdminSessionStore,
  getSessionCookie,
  readSessionCookie,
  verifyAdminToken,
  verifyPassword,
  type AdminSessionStore,
} from './adminAuth'
import type { AdminLoginNotifier, EnquiryNotifier } from './enquiryNotifier'
import type { Enquiry, EnquiryRepository } from './enquiryRepository'
import { enquiryInputSchema, getFieldErrors } from './enquirySchema'

type CreateAppOptions = {
  admin?: AdminAccessConfig | null
  adminLoginNotificationCooldownMs?: number
  adminLoginNotifier?: AdminLoginNotifier | null
  adminSessionStore?: AdminSessionStore
  allowedOrigins?: ReadonlySet<string>
  enquiryNotifier?: EnquiryNotifier | null
  enquiryRepository: EnquiryRepository | null
  staticDirectory?: string
  sameOriginOnly?: boolean
  workerManagedRateLimits?: boolean
  trustProxy?: false | number
  clock?: () => Date
}

export type AdminAccessConfig = {
  cookieSameSite?: 'None' | 'Strict'
  isProduction: boolean
  jwtSecret: string
  passwordHash: string
  username: string
}

const adminLoginSchema = z.object({
  password: z.string().min(1).max(256),
  username: z.string().trim().min(1).max(128),
})

const unavailableResponse = {
  accepted: false,
  code: 'SERVICE_UNAVAILABLE',
  message: 'Enquiry delivery is temporarily unavailable. Please try again or contact us by phone.',
} as const

export function createApp({
  admin = null,
  adminLoginNotificationCooldownMs = 15 * 60 * 1_000,
  adminLoginNotifier = null,
  adminSessionStore = createMemoryAdminSessionStore(),
  allowedOrigins = new Set(),
  enquiryNotifier = null,
  enquiryRepository,
  staticDirectory,
  sameOriginOnly = false,
  workerManagedRateLimits = false,
  trustProxy = false,
  clock = () => new Date(),
}: CreateAppOptions) {
  const app = express()
  let lastAdminLoginNotificationAt = Number.NEGATIVE_INFINITY
  const failedLogins = new Map<string, { count: number; lastAlertAt: number; windowStartedAt: number }>()

  app.disable('x-powered-by')
  if (trustProxy !== false) app.set('trust proxy', trustProxy)
  app.use(compression())
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  )
  app.use('/api/admin', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store')
    next()
  })
  const requestOriginMatchesHost = (request: express.Request) => {
    const origin = request.get('origin')
    if (!origin) return false
    try {
      return new URL(origin).host === request.get('host')
    } catch {
      return false
    }
  }

  app.use('/api', (request, response, next) => {
    const origin = request.get('origin')
    const originAllowed = Boolean(origin && allowedOrigins.has(origin))
    const stateChanging = !['GET', 'HEAD'].includes(request.method)

    if (!sameOriginOnly) {
      response.vary('Origin')
      if (originAllowed) {
        response.setHeader('Access-Control-Allow-Origin', origin!)
        response.setHeader('Access-Control-Allow-Credentials', 'true')
        response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      }
    }

    if (request.method === 'OPTIONS') {
      response.status(sameOriginOnly || (allowedOrigins.size > 0 && !originAllowed) ? 403 : 204).end()
      return
    }
    if (sameOriginOnly && stateChanging && !requestOriginMatchesHost(request)) {
      response.status(403).json({ message: 'Origin is not allowed.' })
      return
    }
    if (!sameOriginOnly && allowedOrigins.size > 0 && stateChanging && !originAllowed) {
      response.status(403).json({ message: 'Origin is not allowed.' })
      return
    }
    next()
  })
  app.use(express.json({ limit: '32kb', strict: true }))

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  const passRateLimiter: express.RequestHandler = (_request, _response, next) => next()
  const enquiryLimiter = workerManagedRateLimits ? passRateLimiter : rateLimit({
    windowMs: 15 * 60 * 1_000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_request, response) {
      response.status(429).json({
        accepted: false,
        code: 'RATE_LIMITED',
        message: 'Too many enquiries were submitted from this connection. Please wait and try again.',
      })
    },
  })

  const adminLoginLimiter = workerManagedRateLimits ? passRateLimiter : rateLimit({
    windowMs: 15 * 60 * 1_000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_request, response) {
      response.status(429).json({ authenticated: false, message: 'Too many sign-in attempts. Please wait and try again.' })
    },
  })

  const hasAllowedOrigin = (request: express.Request) => {
    const origin = request.get('origin')
    if (!origin) return false
    if (allowedOrigins.size > 0) return allowedOrigins.has(origin)
    try {
      return new URL(origin).host === request.get('host')
    } catch {
      return false
    }
  }

  const requireAdmin = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (!admin) {
      response.status(503).json({ authenticated: false, message: 'Admin access is not configured.' })
      return
    }

    const token = readSessionCookie(request.get('cookie'))
    if (!token) {
      response.status(401).json({ authenticated: false })
      return
    }

    try {
      const session = await verifyAdminToken(token, admin.jwtSecret)
      if (!session.jti || !(await adminSessionStore.isActive(session.jti, clock().getTime()))) throw new Error('Expired admin session.')
      response.locals.adminSession = session
      next()
    } catch {
      response.status(401).setHeader('Set-Cookie', clearSessionCookie(admin.isProduction, admin.cookieSameSite)).json({ authenticated: false })
    }
  }

  app.post(['/api/admin/login', '/api/auth/login'], adminLoginLimiter, async (request, response) => {
    if (!hasAllowedOrigin(request)) {
      response.status(403).json({ authenticated: false, message: 'Sign-in failed.' })
      return
    }
    if (!admin) {
      response.status(503).json({ authenticated: false, message: 'Admin access is not configured.' })
      return
    }

    const parsed = adminLoginSchema.safeParse(request.body)
    if (!parsed.success) {
      response.status(401).json({ authenticated: false, message: 'Sign-in failed.' })
      return
    }

    const passwordMatches = await verifyPassword(parsed.data.password, admin.passwordHash)
    if (!passwordMatches || parsed.data.username !== admin.username) {
      const now = clock()
      const key = request.ip || 'unknown'
      const previous = failedLogins.get(key)
      const state = !previous || now.getTime() - previous.windowStartedAt >= 15 * 60 * 1_000
        ? { count: 1, lastAlertAt: Number.NEGATIVE_INFINITY, windowStartedAt: now.getTime() }
        : { ...previous, count: previous.count + 1 }
      failedLogins.set(key, state)
      if (state.count >= 3 && now.getTime() - state.lastAlertAt >= 15 * 60 * 1_000 && adminLoginNotifier?.notifyAdminLoginFailure) {
        state.lastAlertAt = now.getTime()
        void adminLoginNotifier.notifyAdminLoginFailure({ at: now, username: parsed.data.username, attempts: state.count, ipAddress: request.ip, userAgent: request.get('user-agent')?.slice(0, 500) }).catch(() => {
          console.error('Admin failed-login notification failed.', { category: 'notification_error' })
        })
      }
      response.status(401).json({ authenticated: false, message: 'Sign-in failed.' })
      return
    }

    failedLogins.delete(request.ip || 'unknown')

    const signedInAt = clock()
    const sessionId = crypto.randomUUID()
    await adminSessionStore.create(sessionId, signedInAt.getTime())
    const token = await createAdminToken(admin.username, admin.jwtSecret, sessionId)
    if (adminLoginNotifier && signedInAt.getTime() - lastAdminLoginNotificationAt >= adminLoginNotificationCooldownMs) {
      lastAdminLoginNotificationAt = signedInAt.getTime()
      try {
        await adminLoginNotifier.notifyAdminLogin({ at: signedInAt, username: admin.username, ipAddress: request.ip, userAgent: request.get('user-agent')?.slice(0, 500) })
      } catch {
        console.error('Admin sign-in notification failed.', { category: 'notification_error' })
      }
    }
    response.setHeader('Set-Cookie', getSessionCookie(token, admin.isProduction, admin.cookieSameSite))
    response.json({ authenticated: true })
  })

  app.get('/api/admin/session', requireAdmin, (_request, response) => {
    response.json({ authenticated: true })
  })

  app.post('/api/admin/activity', requireAdmin, async (_request, response) => {
    const sessionId = response.locals.adminSession?.jti
    if (!sessionId || !(await adminSessionStore.touch(sessionId, clock().getTime()))) {
      response.status(401).setHeader('Set-Cookie', clearSessionCookie(Boolean(admin?.isProduction), admin?.cookieSameSite)).json({ authenticated: false })
      return
    }
    const token = await createAdminToken(admin!.username, admin!.jwtSecret, sessionId)
    response.setHeader('Set-Cookie', getSessionCookie(token, admin!.isProduction, admin!.cookieSameSite))
    response.json({ authenticated: true, idleTimeoutMs: adminIdleTimeoutMs })
  })

  app.get('/api/admin/enquiries', requireAdmin, async (_request, response) => {
    if (!enquiryRepository?.listRecent) {
      response.status(503).json({ message: 'Enquiry records are temporarily unavailable.' })
      return
    }
    try {
      response.json({ enquiries: await enquiryRepository.listRecent(100) })
    } catch {
      response.status(503).json({ message: 'Enquiry records are temporarily unavailable.' })
    }
  })

  app.post('/api/admin/logout', async (request, response) => {
    if (!hasAllowedOrigin(request)) {
      response.status(403).json({ authenticated: false })
      return
    }
    const token = readSessionCookie(request.get('cookie'))
    if (token && admin) {
      try {
        const session = await verifyAdminToken(token, admin.jwtSecret)
        if (session.jti) await adminSessionStore.revoke(session.jti)
      } catch { /* Clearing an invalid cookie is still a successful logout. */ }
    }
    response.setHeader('Set-Cookie', clearSessionCookie(Boolean(admin?.isProduction), admin?.cookieSameSite))
    response.status(204).end()
  })

  app.post('/api/enquiries', enquiryLimiter, async (request, response) => {
    const honeypot = request.body && typeof request.body === 'object' ? request.body.website : undefined
    if (typeof honeypot === 'string' && honeypot.trim()) {
      response.status(201).json({ accepted: true })
      return
    }

    const parsed = enquiryInputSchema.safeParse(request.body)
    if (!parsed.success) {
      response.status(422).json({
        accepted: false,
        code: 'VALIDATION_ERROR',
        fieldErrors: getFieldErrors(parsed.error),
      })
      return
    }

    if (!enquiryRepository) {
      response.status(503).json(unavailableResponse)
      return
    }

    const { businessName, consent, email, fullName, location, message, phone, service } = parsed.data

    const enquiry: Enquiry = {
      businessName,
      consent,
      createdAt: new Date(),
      email,
      fullName,
      location,
      message,
      reference: `GVT-${clock().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(6).toString('hex').toUpperCase()}`,
      phone,
      service,
      source: 'website',
      status: 'new',
    }

    try {
      await enquiryRepository.insert(enquiry)
      try {
        await enquiryNotifier?.notify(enquiry)
      } catch {
        console.error('Enquiry notification failed after storage.', { category: 'notification_error' })
        response.status(201).json({ accepted: true, reference: enquiry.reference })
        return
      }
      response.status(201).json({ accepted: true, reference: enquiry.reference })
    } catch {
      response.status(503).json(unavailableResponse)
    }
  })

  if (staticDirectory) {
    app.use(
      '/assets',
      express.static(join(staticDirectory, 'assets'), {
        immutable: true,
        index: false,
        maxAge: '1y',
      }),
    )
    app.use(express.static(staticDirectory, { extensions: ['html'], index: false }))
    app.use((request, response, next) => {
      if (request.method === 'GET' && request.accepts('html')) {
        response.sendFile(join(staticDirectory, 'index.html'))
        return
      }
      next()
    })
  }

  const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
      response.status(413).json({
        accepted: false,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'The enquiry is too large to submit.',
      })
      return
    }
    next(error)
  }
  app.use(errorHandler)

  return app
}
