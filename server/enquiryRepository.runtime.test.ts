// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mongo = vi.hoisted(() => {
  const toArray = vi.fn(async () => [])
  const limit = vi.fn(() => ({ toArray }))
  const sort = vi.fn(() => ({ limit }))
  const find = vi.fn(() => ({ sort }))
  const collection = { find, insertOne: vi.fn(async () => {}) }
  const db = {
    collection: vi.fn(() => collection),
    command: vi.fn(),
    createCollection: vi.fn(),
    listCollections: vi.fn(),
  }
  const client = { close: vi.fn(), connect: vi.fn(), db: vi.fn(() => db) }
  client.connect.mockResolvedValue(client)
  return { client, collection, db, find, limit, sort, toArray }
})

vi.mock('mongodb', () => ({
  MongoClient: vi.fn(function MongoClient() { return mongo.client }),
  MongoServerError: class MongoServerError extends Error {},
}))

import { createMongoEnquiryRepository } from './enquiryRepository'

describe('MongoDB runtime repository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads records without attempting deployment-time schema administration', async () => {
    const repository = createMongoEnquiryRepository({
      collectionName: 'enquiries',
      dbName: 'gauvistech',
      uri: 'mongodb://database.example',
    })

    await repository.listRecent?.(100)

    expect(mongo.client.connect).toHaveBeenCalledOnce()
    expect(mongo.db.collection).toHaveBeenCalledWith('enquiries')
    expect(mongo.db.listCollections).not.toHaveBeenCalled()
    expect(mongo.db.command).not.toHaveBeenCalled()
    expect(mongo.db.createCollection).not.toHaveBeenCalled()
    expect(mongo.find).toHaveBeenCalledWith({}, { projection: { _id: 0 } })
    expect(mongo.sort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(mongo.limit).toHaveBeenCalledWith(100)
    expect(mongo.toArray).toHaveBeenCalledOnce()
  })
})
