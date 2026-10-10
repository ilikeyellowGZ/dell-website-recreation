import compression from 'compression'
import express, { type ErrorRequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { join } from 'node:path'
import { z } from 'zod'
import {
  clearSessionCookie,
  createAdminToken,
  getSessionCookie,
  readSessionCookie,
  verifyAdminToken,
  verifyPassword,
} from './adminAuth'
import type { EnquiryRepository } from './enquiryRepository'
import { enquiryInputSchema, getFieldErrors } from './enquirySchema'

type CreateAppOptions = {
  admin?: AdminAccessConfig | null
  enquiriesEnabled?: boolean
  enquiryRepository: EnquiryRepository | null
  staticDirectory?: string
  trustProxy?: false | number
}

export type AdminAccessConfig = {
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
  enquiriesEnabled = true,
  enquiryRepository,
  staticDirectory,
  trustProxy = false,
}: CreateAppOptions) {
  const app = express()

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
  app.use(express.json({ limit: '32kb', strict: true }))

  const enquiryLimiter = rateLimit({
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

  const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1_000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(_request, response) {
      response.status(429).json({ authenticated: false, message: 'Too many sign-in attempts. Please wait and try again.' })
    },
  })

  const setAdminNoStore = (_request: express.Request, response: express.Response, next: express.NextFunction) => {
    response.setHeader('Cache-Control', 'no-store')
    next()
  }

  const hasSameOrigin = (request: express.Request) => {
    const origin = request.get('origin')
    if (!origin) return false
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
      response.locals.adminSession = await verifyAdminToken(token, admin.jwtSecret)
      next()
    } catch {
      response.status(401).setHeader('Set-Cookie', clearSessionCookie(admin.isProduction)).json({ authenticated: false })
    }
  }

  app.use('/api/admin', setAdminNoStore)

  app.post('/api/admin/login', adminLoginLimiter, async (request, response) => {
    if (!hasSameOrigin(request)) {
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
      response.status(401).json({ authenticated: false, message: 'Sign-in failed.' })
      return
    }

    const token = await createAdminToken(admin.username, admin.jwtSecret)
    response.setHeader('Set-Cookie', getSessionCookie(token, admin.isProduction))
    response.json({ authenticated: true })
  })

  app.get('/api/admin/session', requireAdmin, (_request, response) => {
    response.json({ authenticated: true })
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

  app.post('/api/admin/logout', (request, response) => {
    if (!hasSameOrigin(request)) {
      response.status(403).json({ authenticated: false })
      return
    }
    response.setHeader('Set-Cookie', clearSessionCookie(Boolean(admin?.isProduction)))
    response.status(204).end()
  })

  app.post('/api/enquiries', enquiryLimiter, async (request, response) => {
    if (!enquiriesEnabled) {
      response.status(503).json({
        accepted: false,
        code: 'ENQUIRIES_DISABLED',
        message: 'Online enquiries are not available yet. Please contact us by phone or WhatsApp.',
      })
      return
    }

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

    try {
      await enquiryRepository.insert({
        businessName,
        consent,
        createdAt: new Date(),
        email,
        fullName,
        location,
        message,
        phone,
        service,
        source: 'website',
        status: 'new',
      })
      response.status(201).json({ accepted: true })
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
    app.use(express.static(staticDirectory, { index: false }))
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
