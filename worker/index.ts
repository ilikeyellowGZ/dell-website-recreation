import { createServer, type Server } from 'node:http'
import { handleAsNodeRequest } from 'cloudflare:node'
import { createApp } from '../server/app'
import { createWorkerRuntime } from './config'
import { MongoEnquiryDurableObject } from './mongo-durable-object'
import { SecurityDurableObject } from './security-durable-object'
import type { WorkerEnv } from './types'

const nodePort = 8788
let server: Server | undefined

function isAdminLoginPath(pathname: string): boolean {
  return pathname === '/api/admin/login' || pathname === '/api/auth/login'
}

function createRateLimitResponse(pathname: string): Response {
  const body = isAdminLoginPath(pathname)
    ? { authenticated: false, message: 'Too many sign-in attempts. Please wait and try again.' }
    : {
        accepted: false,
        code: 'RATE_LIMITED',
        message: 'Too many enquiries were submitted from this connection. Please wait and try again.',
      }
  return Response.json(body, { status: 429 })
}

async function keyedIdentity(request: Request, env: WorkerEnv, scope: string): Promise<string | null> {
  const secret = env.RATE_LIMIT_KEY_SECRET?.trim()
  if (!secret) return null
  const address = request.headers.get('CF-Connecting-IP') || 'local'
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { hash: 'SHA-256', name: 'HMAC' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${scope}:${address}`))
  return Array.from(new Uint8Array(signature), (value) => value.toString(16).padStart(2, '0')).join('')
}

async function isAllowedByGlobalLimit(request: Request, env: WorkerEnv, pathname: string): Promise<boolean | null> {
  const scope = isAdminLoginPath(pathname) ? 'admin-login' : 'enquiry'
  const identity = await keyedIdentity(request, env, scope)
  if (!identity) return null
  const state = env.SECURITY_STATE.get(env.SECURITY_STATE.idFromName('gauvis-security-state'))
  return state.consume(identity, 5, 15 * 60 * 1_000)
}

function getServer(env: WorkerEnv): Server {
  if (server) return server
  const runtime = createWorkerRuntime(env)
  const securityState = env.SECURITY_STATE.get(env.SECURITY_STATE.idFromName('gauvis-security-state'))
  const loginNotifier = runtime.enquiryNotifier
    ? {
        async notifyAdminLogin(alert: { at: Date; username: string }) {
          if (await securityState.shouldNotifyAdminLogin(alert.username, runtime.adminLoginNotificationCooldownMs)) {
            await runtime.enquiryNotifier!.notifyAdminLogin(alert)
          }
        },
      }
    : null

  const app = createApp({
    admin: runtime.admin,
    // The durable object is the cross-isolate login-alert cooldown authority.
    adminLoginNotificationCooldownMs: 0,
    adminLoginNotifier: loginNotifier,
    enquiriesEnabled: runtime.enquiriesEnabled,
    enquiryNotifier: runtime.enquiryNotifier,
    enquiryRepository: runtime.enquiryRepository,
    sameOriginOnly: true,
    workerManagedRateLimits: true,
  })
  server = createServer(app)
  server.listen(nodePort)
  return server
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (request.method === 'POST' && (pathname === '/api/enquiries' || isAdminLoginPath(pathname))) {
      const allowed = await isAllowedByGlobalLimit(request, env, pathname)
      if (allowed === false) return createRateLimitResponse(pathname)
      if (allowed === null) {
        return Response.json({ message: 'Security configuration is unavailable.' }, { status: 503 })
      }
    }
    getServer(env)
    return handleAsNodeRequest(nodePort, request)
  },
}

export { MongoEnquiryDurableObject, SecurityDurableObject }
