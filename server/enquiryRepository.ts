import { MongoClient, type Collection } from 'mongodb'
import type { EnquiryInput } from './enquirySchema'

export type Enquiry = Omit<EnquiryInput, 'website'> & {
  createdAt: Date
  source: 'website'
  status: 'new'
}

export interface EnquiryRepository {
  close?: () => Promise<void>
  insert: (enquiry: Enquiry) => Promise<void>
}

type MongoRepositoryOptions = {
  collectionName?: string
  dbName: string
  uri: string
}

export function createMongoEnquiryRepository({
  collectionName = 'enquiries',
  dbName,
  uri,
}: MongoRepositoryOptions): EnquiryRepository {
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5_000,
  })
  let collectionPromise: Promise<Collection<Enquiry>> | undefined

  const getCollection = () => {
    collectionPromise ??= client.connect().then(() => client.db(dbName).collection<Enquiry>(collectionName))
    return collectionPromise
  }

  return {
    async insert(enquiry) {
      const collection = await getCollection()
      await collection.insertOne(enquiry)
    },
    async close() {
      await client.close()
    },
  }
}

export function createConfiguredMongoEnquiryRepository(
  environment: NodeJS.ProcessEnv = process.env,
): EnquiryRepository | null {
  const uri = environment.MONGODB_URI?.trim()
  const dbName = environment.MONGODB_DB_NAME?.trim()

  if (!uri || !dbName) return null

  return createMongoEnquiryRepository({
    uri,
    dbName,
    collectionName: environment.MONGODB_COLLECTION?.trim() || 'enquiries',
  })
}
