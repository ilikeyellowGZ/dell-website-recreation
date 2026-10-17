import { DurableObject } from 'cloudflare:workers'
import { createMongoEnquiryRepository, type Enquiry, type EnquiryRepository } from '../server/enquiryRepository'
import type { WorkerEnv } from './types'

/** Holds the MongoDB client in one durable process, as required for connection reuse on Workers. */
export class MongoEnquiryDurableObject extends DurableObject<WorkerEnv> {
  private readonly repository: EnquiryRepository | null

  constructor(ctx: DurableObjectState, env: WorkerEnv) {
    super(ctx, env)
    const uri = env.MONGODB_URI?.trim()
    this.repository = uri
      ? createMongoEnquiryRepository({
          uri,
          dbName: env.MONGODB_DB_NAME?.trim() || 'gauvistech',
          collectionName: env.MONGODB_COLLECTION?.trim() || 'enquiries',
          maxPoolSize: 1,
          minPoolSize: 0,
          maxIdleTimeMS: 20_000,
        })
      : null
  }

  async insert(enquiry: Enquiry): Promise<void> {
    if (!this.repository) throw new Error('MongoDB is not configured.')
    await this.repository.insert({ ...enquiry, createdAt: new Date(enquiry.createdAt) })
  }

  async listRecent(limit: number): Promise<Enquiry[]> {
    if (!this.repository?.listRecent) throw new Error('MongoDB is not configured.')
    return this.repository.listRecent(limit)
  }
}
