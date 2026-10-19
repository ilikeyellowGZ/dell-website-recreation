import type { EnquiryRepository } from '../server/enquiryRepository'
import type { AdminAccessConfig } from '../server/app'
import { createWorkerResendNotifier, type WorkerEnquiryNotifier } from './notifier'
import type { WorkerEnv } from './types'

export type WorkerRuntime = {
  admin: AdminAccessConfig | null
  adminLoginNotificationCooldownMs: number
  enquiryNotifier: WorkerEnquiryNotifier | null
  enquiryRepository: EnquiryRepository | null
}

function cooldownMs(value: string | undefined): number {
  const seconds = Number(value?.trim() || '900')
  return Number.isSafeInteger(seconds) && seconds >= 1 && seconds <= 86_400 ? seconds * 1_000 : 15 * 60 * 1_000
}

export function createWorkerRuntime(env: WorkerEnv): WorkerRuntime {
  const username = env.ADMIN_USERNAME?.trim()
  const passwordHash = env.ADMIN_PASSWORD_HASH?.trim()
  const jwtSecret = env.JWT_SECRET_KEY?.trim()
  const mongoConfigured = Boolean(env.MONGODB_URI?.trim())
  const repository = mongoConfigured
    ? {
        insert: (enquiry: Parameters<NonNullable<EnquiryRepository>['insert']>[0]) =>
          env.MONGODB_REPOSITORY.get(env.MONGODB_REPOSITORY.idFromName('gauvis-enquiries')).insert(enquiry),
        listRecent: (limit: number) =>
          env.MONGODB_REPOSITORY.get(env.MONGODB_REPOSITORY.idFromName('gauvis-enquiries')).listRecent(limit),
      } satisfies EnquiryRepository
    : null

  return {
    admin: username && passwordHash && jwtSecret
      ? { isProduction: true, cookieSameSite: 'Strict', jwtSecret, passwordHash, username }
      : null,
    adminLoginNotificationCooldownMs: cooldownMs(env.ADMIN_LOGIN_NOTIFICATION_COOLDOWN_SECONDS),
    enquiryNotifier: createWorkerResendNotifier(env),
    enquiryRepository: repository,
  }
}
