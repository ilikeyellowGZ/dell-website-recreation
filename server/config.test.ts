// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { getRuntimeConfig, parseAdminLoginNotificationCooldownSeconds, parseFrontendOrigins, parseTrustProxy } from './config'

describe('parseFrontendOrigins', () => {
  it('normalizes exact HTTPS origins and removes duplicates', () => {
    expect([...parseFrontendOrigins(' https://GAUVIS.co.za:443/, https://www.gauvis.co.za,https://gauvis.co.za ', true)])
      .toEqual(['https://gauvis.co.za', 'https://www.gauvis.co.za'])
    expect([...parseFrontendOrigins('https://gauvis.co.za:8443', true)]).toEqual(['https://gauvis.co.za:8443'])
  })

  it('allows the local Vite client when configuration is absent outside production', () => {
    expect([...parseFrontendOrigins(undefined, false)]).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ])
    expect([...parseFrontendOrigins('  ', false)]).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ])
  })

  it.each([
    undefined, '', ' ', '*', 'https://*.gauvis.co.za', 'https://gauvis.*',
    'https://%2a.gauvis.co.za', 'https://gauvis.%2A', 'https://%252a.gauvis.co.za',
    'https://＊.gauvis.co.za', 'https://gauvis.＊',
    'http://gauvis.co.za', 'gauvis.co.za', 'https:gauvis.co.za',
    'https://user:password@gauvis.co.za', 'https://gauvis.co.za?query=1',
    'https://gauvis.co.za?', 'https://gauvis.co.za#fragment', 'https://gauvis.co.za#',
    'https://gauvis.co.za/contact', 'https://gauvis.co.za/section/..',
    'https://gauvis.co.za\\contact', 'https://gauvis.co.za,', ',https://gauvis.co.za',
  ])('rejects unsafe production configuration %s without echoing it', (value) => {
    expect(() => parseFrontendOrigins(value, true)).toThrow(/^FRONTEND_ORIGIN must contain one or more absolute HTTPS origins without wildcards, credentials, paths, queries, or fragments\.$/)
  })
})

describe('parseTrustProxy', () => {
  it('does not trust forwarded addresses when configuration is absent', () => {
    expect(parseTrustProxy(undefined)).toBe(false)
    expect(parseTrustProxy('')).toBe(false)
  })

  it('accepts an explicit positive proxy hop count', () => {
    expect(parseTrustProxy('1')).toBe(1)
    expect(parseTrustProxy(' 2 ')).toBe(2)
  })

  it('rejects broad or malformed trust values', () => {
    for (const value of ['true', '0', '-1', '1.5', 'anything']) {
      expect(() => parseTrustProxy(value)).toThrow(/TRUST_PROXY/)
    }
  })
})

describe('parseAdminLoginNotificationCooldownSeconds', () => {
  it('uses a 15-minute default and accepts safe configured values', () => {
    expect(parseAdminLoginNotificationCooldownSeconds()).toBe(900)
    expect(parseAdminLoginNotificationCooldownSeconds(' 60 ')).toBe(60)
    expect(parseAdminLoginNotificationCooldownSeconds('86400')).toBe(86_400)
  })

  it.each(['0', '-1', '1.5', 'true', '86401'])('rejects unsafe cooldown values', (value) => {
    expect(() => parseAdminLoginNotificationCooldownSeconds(value)).toThrow(/ADMIN_LOGIN_NOTIFICATION_COOLDOWN_SECONDS/)
  })
})

describe('getRuntimeConfig', () => {
  it('keeps production API-only even when a frontend build exists', () => {
    expect(getRuntimeConfig({ NODE_ENV: 'production', FRONTEND_ORIGIN: 'https://gauvis.co.za' }).serveFrontend).toBe(false)
    expect(getRuntimeConfig({
      NODE_ENV: 'production',
      FRONTEND_ORIGIN: 'https://gauvis.co.za',
      SERVE_FRONTEND: 'true',
    }).serveFrontend).toBe(true)
  })

  it('serves the frontend by default for local preview workflows', () => {
    expect(getRuntimeConfig({ NODE_ENV: 'development' }).serveFrontend).toBe(true)
    expect(getRuntimeConfig({ NODE_ENV: 'test', SERVE_FRONTEND: 'false' }).serveFrontend).toBe(false)
    expect(() => getRuntimeConfig({ NODE_ENV: 'development', SERVE_FRONTEND: 'yes' })).toThrow(/SERVE_FRONTEND/)
  })

  it('does not expose a switch that can disable enquiries', () => {
    expect(getRuntimeConfig({ NODE_ENV: 'production', FRONTEND_ORIGIN: 'https://gauvis.co.za' })).not.toHaveProperty('enquiriesEnabled')
  })

  it('validates and exposes frontend origins at startup', () => {
    expect(() => getRuntimeConfig({ NODE_ENV: 'production' })).toThrow(/FRONTEND_ORIGIN/)
    expect([...getRuntimeConfig({ NODE_ENV: 'production', FRONTEND_ORIGIN: 'https://gauvis.co.za' }).frontendOrigins])
      .toEqual(['https://gauvis.co.za'])
  })

  it('exposes the configured login-alert cooldown in milliseconds', () => {
    expect(getRuntimeConfig({ NODE_ENV: 'development', ADMIN_LOGIN_NOTIFICATION_COOLDOWN_SECONDS: '60' }))
      .toMatchObject({ adminLoginNotificationCooldownMs: 60_000 })
  })

})
