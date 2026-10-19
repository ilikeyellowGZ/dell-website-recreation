import type { AdminSessionStore } from '../server/adminAuth'
import type { WorkerEnv } from './types'

export function getSecurityState(env: WorkerEnv) {
  return env.SECURITY_STATE.get(env.SECURITY_STATE.idFromName('gauvis-security-state'))
}

export function createWorkerAdminSessionStore(env: WorkerEnv): AdminSessionStore {
  return {
    create: (sessionId, now) => getSecurityState(env).createAdminSession(sessionId, now),
    isActive: (sessionId, now) => getSecurityState(env).isAdminSessionActive(sessionId, now),
    touch: (sessionId, now) => getSecurityState(env).touchAdminSession(sessionId, now),
    revoke: (sessionId) => getSecurityState(env).revokeAdminSession(sessionId),
  }
}
