import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiUrl, resolveApiUrl } from './api'

afterEach(() => vi.unstubAllEnvs())

describe('API URL resolution', () => {
  it('keeps relative API paths when no origin is configured', () => {
    expect(resolveApiUrl('/api/enquiries', undefined)).toBe('/api/enquiries')
    expect(resolveApiUrl('/api/enquiries', '')).toBe('/api/enquiries')
  })

  it('normalizes the configured origin and removes its trailing slash', () => {
    expect(resolveApiUrl('/api/enquiries', 'https://gauvis-api.onrender.com/')).toBe(
      'https://gauvis-api.onrender.com/api/enquiries',
    )
    expect(resolveApiUrl('/api/admin/session', 'https://GAUVIS-API.onrender.com:443', true)).toBe(
      'https://gauvis-api.onrender.com/api/admin/session',
    )
  })

  it.each([
    '*',
    'http://api.example.com',
    'https://api.example.com/path',
    'not-a-url',
    'https://user:password@api.example.com',
    'https://api.example.com?query=value',
    'https://api.example.com?',
    'https://api.example.com#fragment',
    'https://api.example.com#',
    'ftp://api.example.com',
    '//api.example.com',
  ])('rejects invalid production origin %s with a configuration error', (origin) => {
    expect(() => resolveApiUrl('/api/enquiries', origin, true)).toThrow(/VITE_API_BASE_URL/)
  })

  it.each([
    'https://*',
    'https://*.example.com',
    'https://api.*.example.com',
    'https://api*.example.com/',
    'https://%2A.example.com',
    'https://%2a.example.com',
    'https://api%2A.example.com/',
  ])('rejects wildcard origin %s in production and development', (origin) => {
    expect(() => resolveApiUrl('/api/enquiries', origin, true)).toThrow(/VITE_API_BASE_URL/)
    expect(() => resolveApiUrl('/api/enquiries', origin, false)).toThrow(/VITE_API_BASE_URL/)
  })

  it('permits an HTTP API origin during local development', () => {
    expect(resolveApiUrl('/api/enquiries', 'http://localhost:3001/', false)).toBe(
      'http://localhost:3001/api/enquiries',
    )
  })

  it('uses the frontend environment configuration for application requests', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://gauvis-api.onrender.com/')
    expect(apiUrl('/api/admin/login')).toBe('https://gauvis-api.onrender.com/api/admin/login')
  })
})
