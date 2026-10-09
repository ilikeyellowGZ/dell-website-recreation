import 'dotenv/config'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createApp } from './app'
import { createConfiguredMongoEnquiryRepository } from './enquiryRepository'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const distDirectory = join(currentDirectory, '..', 'dist')
const portArgumentIndex = process.argv.indexOf('--port')
const requestedPort = portArgumentIndex >= 0 ? Number(process.argv[portArgumentIndex + 1]) : Number(process.env.PORT)
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 3001
const enquiryRepository = createConfiguredMongoEnquiryRepository()

const app = createApp({
  enquiryRepository,
  staticDirectory: existsSync(join(distDirectory, 'index.html')) ? distDirectory : undefined,
})

const server = app.listen(port, () => {
  console.info(`Gauvis Tech server listening on http://127.0.0.1:${port}`)
  if (!enquiryRepository) {
    console.warn('MongoDB enquiry storage is unavailable until MONGODB_URI and MONGODB_DB_NAME are configured.')
  }
})

async function shutdown() {
  server.close()
  await enquiryRepository?.close?.()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
