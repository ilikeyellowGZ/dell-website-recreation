import 'dotenv/config'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createApp } from './app'
import { getRuntimeConfig } from './config'
import { createConfiguredMongoEnquiryRepository } from './enquiryRepository'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const distDirectory = join(currentDirectory, '..', 'dist')
const portArgumentIndex = process.argv.indexOf('--port')
const requestedPort = portArgumentIndex >= 0 ? Number(process.argv[portArgumentIndex + 1]) : Number(process.env.PORT)
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 3001
const enquiryRepository = createConfiguredMongoEnquiryRepository()
const runtimeConfig = getRuntimeConfig()
const admin =
  process.env.ADMIN_USERNAME?.trim() && process.env.ADMIN_PASSWORD_HASH?.trim() && process.env.JWT_SECRET_KEY?.trim()
    ? {
        isProduction: runtimeConfig.isProduction,
        jwtSecret: process.env.JWT_SECRET_KEY.trim(),
        passwordHash: process.env.ADMIN_PASSWORD_HASH.trim(),
        username: process.env.ADMIN_USERNAME.trim(),
      }
    : null

const app = createApp({
  admin,
  enquiriesEnabled: runtimeConfig.enquiriesEnabled,
  enquiryRepository,
  staticDirectory: existsSync(join(distDirectory, 'index.html')) ? distDirectory : undefined,
  trustProxy: runtimeConfig.trustProxy,
})

const server = app.listen(port, () => {
  console.info(`Gauvis Tech server listening on http://127.0.0.1:${port}`)
  if (!enquiryRepository) {
    console.warn('MongoDB enquiry storage is unavailable until MONGODB_URI and MONGODB_DB_NAME are configured.')
  }
  if (!runtimeConfig.enquiriesEnabled) {
    console.warn('Public enquiry collection is disabled. Set ENABLE_ENQUIRIES=true only after legal content is approved.')
  }
  if (!admin) console.warn('Admin access is unavailable until ADMIN_USERNAME, ADMIN_PASSWORD_HASH, and JWT_SECRET_KEY are configured.')
})

async function shutdown() {
  server.close()
  await enquiryRepository?.close?.()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
