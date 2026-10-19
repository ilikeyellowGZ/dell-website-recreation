// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createWorkerAdminSessionStore } from './admin-session-store'
import type { WorkerEnv } from './types'

describe('Worker admin session storage', () => {
  it('resolves a fresh Durable Object stub for every request operation', async () => {
    const stub = {
      createAdminSession: vi.fn(async () => {}),
      isAdminSessionActive: vi.fn(async () => true),
      touchAdminSession: vi.fn(async () => true),
      revokeAdminSession: vi.fn(async () => {}),
    }
    const get = vi.fn(() => stub)
    const env = {
      SECURITY_STATE: {
        get,
        idFromName: vi.fn(() => ({ equals: () => true, toString: () => 'security-id' })),
      },
    } as unknown as WorkerEnv
    const store = createWorkerAdminSessionStore(env)

    await store.create('session-id', 1)
    await store.isActive('session-id', 2)
    await store.touch('session-id', 3)
    await store.revoke('session-id')

    expect(get).toHaveBeenCalledTimes(4)
    expect(stub.createAdminSession).toHaveBeenCalledWith('session-id', 1)
    expect(stub.isAdminSessionActive).toHaveBeenCalledWith('session-id', 2)
    expect(stub.touchAdminSession).toHaveBeenCalledWith('session-id', 3)
    expect(stub.revokeAdminSession).toHaveBeenCalledWith('session-id')
  })
})
