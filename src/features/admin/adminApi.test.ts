import { afterEach, describe, expect, it, vi } from 'vitest'
import { getEnquiries, getSession, login, logout } from './adminApi'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe.each([
  { configuredOrigin: undefined, expectedOrigin: '' },
  { configuredOrigin: 'https://gauvis-api.onrender.com/', expectedOrigin: 'https://gauvis-api.onrender.com' },
])('admin API client with origin $configuredOrigin', ({ configuredOrigin, expectedOrigin }) => {
  it('uses resolved URLs and includes credentials for sign in and session requests', async () => {
    vi.stubEnv('VITE_API_BASE_URL', configuredOrigin)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ authenticated: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ authenticated: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(login({ username: 'admin', password: 'secret' })).resolves.toEqual({ authenticated: true })
    await expect(getSession()).resolves.toBe(true)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${expectedOrigin}/api/admin/login`,
      {
        body: JSON.stringify({ username: 'admin', password: 'secret' }),
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${expectedOrigin}/api/admin/session`, { credentials: 'include' })
  })

  it('returns typed enquiry records and signs out with a POST', async () => {
    vi.stubEnv('VITE_API_BASE_URL', configuredOrigin)
    const enquiry = {
      businessName: 'Ndlovu Trading',
      createdAt: '2026-10-10T08:00:00.000Z',
      email: 'thandi@example.com',
      fullName: 'Thandi Ndlovu',
      location: 'Cape Town',
      message: 'Hardware support required.',
      phone: '+27 84 123 4567',
      service: 'Hardware Support',
      status: 'new',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enquiries: [enquiry] }) })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getEnquiries()).resolves.toEqual([enquiry])
    await logout()
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${expectedOrigin}/api/admin/enquiries`, {
      credentials: 'include',
    })
    expect(fetchMock).toHaveBeenLastCalledWith(`${expectedOrigin}/api/admin/logout`, {
      credentials: 'include',
      method: 'POST',
    })
  })
})
