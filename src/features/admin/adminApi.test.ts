import { afterEach, describe, expect, it, vi } from 'vitest'
import { getEnquiries, getSession, login, logout } from './adminApi'

afterEach(() => vi.unstubAllGlobals())

describe('admin API client', () => {
  it('uses same-origin credentials for sign in and session requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ authenticated: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ authenticated: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(login({ username: 'admin', password: 'secret' })).resolves.toEqual({ authenticated: true })
    await expect(getSession()).resolves.toBe(true)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/admin/login',
      expect.objectContaining({ credentials: 'same-origin', method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/admin/session', { credentials: 'same-origin' })
  })

  it('returns typed enquiry records and signs out with a POST', async () => {
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
    expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/logout', {
      credentials: 'same-origin',
      method: 'POST',
    })
  })
})
