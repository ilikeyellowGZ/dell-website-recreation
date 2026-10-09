import { MongoClient, MongoServerError, type Collection, type Db, type Document, type IndexDescription } from 'mongodb'
import type { EnquiryInput } from './enquirySchema'

const DEFAULT_DATABASE_NAME = 'gauvistech'
const DEFAULT_COLLECTION_NAME = 'enquiries'

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

type EnquiryCollectionDefinition = {
  collectionName: string
  dbName: string
  indexes: IndexDescription[]
  validator: Document
}

export function getEnquiryCollectionDefinition({
  collectionName = DEFAULT_COLLECTION_NAME,
  dbName = DEFAULT_DATABASE_NAME,
}: Partial<Pick<MongoRepositoryOptions, 'collectionName' | 'dbName'>> = {}): EnquiryCollectionDefinition {
  return {
    dbName,
    collectionName,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        additionalProperties: false,
        required: [
          'fullName',
          'businessName',
          'email',
          'phone',
          'service',
          'location',
          'message',
          'consent',
          'createdAt',
          'source',
          'status',
        ],
        properties: {
          _id: { bsonType: 'objectId' },
          fullName: { bsonType: 'string', minLength: 1, maxLength: 120 },
          businessName: { bsonType: 'string', maxLength: 160 },
          email: { bsonType: 'string', minLength: 1, maxLength: 254 },
          phone: { bsonType: 'string', minLength: 1, maxLength: 40 },
          service: {
            enum: [
              'Hardware Support',
              'Software Solutions',
              'Networking Services',
              'PC & Desktop Support',
              'Microsoft 365 Support',
              'CCTV & Security',
              'Printer Services',
              'Website Development',
            ],
          },
          location: { bsonType: 'string', maxLength: 160 },
          message: { bsonType: 'string', minLength: 1, maxLength: 4000 },
          consent: { bsonType: 'bool', enum: [true] },
          createdAt: { bsonType: 'date' },
          source: { enum: ['website'] },
          status: { enum: ['new'] },
        },
      },
    },
    indexes: [
      { key: { createdAt: -1 }, name: 'createdAt_desc' },
      { key: { status: 1, createdAt: -1 }, name: 'status_createdAt_desc' },
    ],
  }
}

async function ensureEnquiryCollection(db: Db, definition: EnquiryCollectionDefinition): Promise<Collection<Enquiry>> {
  const exists = await db.listCollections({ name: definition.collectionName }, { nameOnly: true }).hasNext()

  if (!exists) {
    try {
      await db.createCollection<Enquiry>(definition.collectionName, {
        validationAction: 'error',
        validationLevel: 'strict',
        validator: definition.validator,
      })
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.codeName !== 'NamespaceExists') throw error
    }
  } else {
    await db.command({
      collMod: definition.collectionName,
      validationAction: 'error',
      validationLevel: 'strict',
      validator: definition.validator,
    })
  }

  const collection = db.collection<Enquiry>(definition.collectionName)
  await collection.createIndexes(definition.indexes)
  return collection
}

export function createMongoEnquiryRepository({
  collectionName = 'enquiries',
  dbName,
  uri,
}: MongoRepositoryOptions): EnquiryRepository {
  const definition = getEnquiryCollectionDefinition({ collectionName, dbName })
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5_000,
  })
  let collectionPromise: Promise<Collection<Enquiry>> | undefined

  const getCollection = () => {
    collectionPromise ??= client.connect().then(() => ensureEnquiryCollection(client.db(dbName), definition))
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
  const dbName = environment.MONGODB_DB_NAME?.trim() || DEFAULT_DATABASE_NAME

  if (!uri) return null

  return createMongoEnquiryRepository({
    uri,
    dbName,
    collectionName: environment.MONGODB_COLLECTION?.trim() || DEFAULT_COLLECTION_NAME,
  })
}

export async function setupConfiguredMongoEnquiryDatabase(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<{ collectionName: string; dbName: string; indexNames: string[] }> {
  const uri = environment.MONGODB_URI?.trim()
  if (!uri) throw new Error('MONGODB_URI is not configured.')

  const definition = getEnquiryCollectionDefinition({
    dbName: environment.MONGODB_DB_NAME?.trim() || DEFAULT_DATABASE_NAME,
    collectionName: environment.MONGODB_COLLECTION?.trim() || DEFAULT_COLLECTION_NAME,
  })
  const client = new MongoClient(uri, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
  })

  try {
    await client.connect()
    const collection = await ensureEnquiryCollection(client.db(definition.dbName), definition)
    const indexes = await collection.indexes()
    return {
      dbName: definition.dbName,
      collectionName: definition.collectionName,
      indexNames: indexes.map((index) => index.name).filter((name): name is string => Boolean(name)),
    }
  } finally {
    await client.close()
  }
}
