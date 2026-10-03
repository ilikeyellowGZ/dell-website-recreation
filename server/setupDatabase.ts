import 'dotenv/config'
import { setupConfiguredMongoEnquiryDatabase } from './enquiryRepository'

try {
  const result = await setupConfiguredMongoEnquiryDatabase()
  console.info(
    `MongoDB ready: database=${result.dbName}, collection=${result.collectionName}, indexes=${result.indexNames.join(',')}`,
  )
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown database setup error.'
  console.error(`MongoDB setup failed: ${message}`)
  process.exitCode = 1
}
