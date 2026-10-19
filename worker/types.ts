import type { MongoEnquiryDurableObject } from './mongo-durable-object'
import type { SecurityDurableObject } from './security-durable-object'

export type WorkerEnv = {
  ADMIN_EMAIL?: string
  COMPANY_NOTIFICATION_EMAIL?: string
  ADMIN_LOGIN_NOTIFICATION_COOLDOWN_SECONDS?: string
  ADMIN_PASSWORD_HASH?: string
  ADMIN_USERNAME?: string
  ENABLE_ENQUIRIES?: string
  JWT_SECRET_KEY?: string
  MONGODB_COLLECTION?: string
  MONGODB_DB_NAME?: string
  MONGODB_URI?: string
  RATE_LIMIT_KEY_SECRET?: string
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string
  MONGODB_REPOSITORY: DurableObjectNamespace<MongoEnquiryDurableObject>
  SECURITY_STATE: DurableObjectNamespace<SecurityDurableObject>
}
