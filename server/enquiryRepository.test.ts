// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { clampEnquiryLimit, createConfiguredMongoEnquiryRepository } from './enquiryRepository'

describe('MongoDB enquiry storage configuration', () => {
  it('bounds admin list sizes to a safe fixed range', () => {
    expect(clampEnquiryLimit(-5)).toBe(1)
    expect(clampEnquiryLimit(25)).toBe(25)
    expect(clampEnquiryLimit(500)).toBe(100)
  })

  it('uses gauvistech and enquiries when only the MongoDB URI is configured', () => {
    const repository = createConfiguredMongoEnquiryRepository({
      MONGODB_URI: 'mongodb://127.0.0.1:27017',
    })

    expect(repository).not.toBeNull()
  })

  it('defines the required database fields and indexes for contact enquiries', async () => {
    const repositoryModule = (await import('./enquiryRepository')) as Record<string, unknown>
    const getDefinition = repositoryModule.getEnquiryCollectionDefinition

    expect(getDefinition).toBeTypeOf('function')

    const definition = (getDefinition as () => {
      collectionName: string
      dbName: string
      indexes: Array<{ key: Record<string, number>; name: string }>
      validator: { $jsonSchema: { required: string[]; properties: Record<string, unknown> } }
    })()

    expect(definition.dbName).toBe('gauvistech')
    expect(definition.collectionName).toBe('enquiries')
    expect(definition.validator.$jsonSchema.required).toEqual([
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
    ])
    expect(definition.validator.$jsonSchema.properties).toMatchObject({
      email: { bsonType: 'string' },
      consent: { bsonType: 'bool' },
      createdAt: { bsonType: 'date' },
      source: { enum: ['website'] },
      status: { enum: ['new'] },
    })
    expect(definition.indexes).toEqual([
      { key: { createdAt: -1 }, name: 'createdAt_desc' },
      { key: { status: 1, createdAt: -1 }, name: 'status_createdAt_desc' },
    ])
  })
})
