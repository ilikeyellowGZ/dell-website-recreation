// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { getRuntimeConfig, parseFrontendOrigins, parseTrustProxy } from './config'

describe('parseFrontendOrigins', () => {
  it('normalizes exact HTTPS origins and removes duplicates', () => {
    expect([...parseFrontendOrigins(' https://GAUVIS.co.za:443/, https://www.gauvis.co.za,https://gauvis.co.za ', true)])
      .toEqual(['https://gauvis.co.za', 'https://www.gauvis.co.za'])
    expect([...parseFrontendOrigins('https://gauvis.co.za:8443', true)]).toEqual(['https://gauvis.co.za:8443'])
  })

  it('allows absent configuration outside production', () => {
    expect([...parseFrontendOrigins(undefined, false)]).toEqual([])
    expect([...parseFrontendOrigins('  ', false)]).toEqual([])
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

describe('getRuntimeConfig', () => {
  it('keeps production enquiries disabled unless explicitly enabled', () => {
    expect(getRuntimeConfig({ NODE_ENV: 'production', FRONTEND_ORIGIN: 'https://gauvis.co.za' }).enquiriesEnabled).toBe(false)
    expect(getRuntimeConfig({ NODE_ENV: 'production', FRONTEND_ORIGIN: 'https://gauvis.co.za', ENABLE_ENQUIRIES: 'true' }).enquiriesEnabled).toBe(true)
  })

  it('validates and exposes frontend origins at startup', () => {
    expect(() => getRuntimeConfig({ NODE_ENV: 'production' })).toThrow(/FRONTEND_ORIGIN/)
    expect([...getRuntimeConfig({ NODE_ENV: 'production', FRONTEND_ORIGIN: 'https://gauvis.co.za' }).frontendOrigins])
      .toEqual(['https://gauvis.co.za'])
  })

  it('allows enquiries by default outside production', () => {
    expect(getRuntimeConfig({ NODE_ENV: 'development' }).enquiriesEnabled).toBe(true)
    expect(getRuntimeConfig({ NODE_ENV: 'test' }).enquiriesEnabled).toBe(true)
  })
})
