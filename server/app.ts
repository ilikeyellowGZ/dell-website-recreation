import compression from 'compression'
import express, { type ErrorRequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { join } from 'node:path'
import type { EnquiryRepository } from './enquiryRepository'
import { enquiryInputSchema, getFieldErrors } from './enquirySchema'

type CreateAppOptions = {
  enquiryRepository: EnquiryRepository | null
  staticDirectory?: string
}

const unavailableResponse = {
  accepted: false,
  code: 'SERVICE_UNAVAILABLE',
  message: 'Enquiry delivery is temporarily unavailable. Please try again or contact us by phone.',
} as const

export function createApp({ enquiryRepository, staticDirectory }: CreateAppOptions) {
  const app = express()

  app.disable('x-powered-by')
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
