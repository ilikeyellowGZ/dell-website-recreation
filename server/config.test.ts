// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { getRuntimeConfig, parseTrustProxy } from './config'

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
    expect(getRuntimeConfig({ NODE_ENV: 'production' }).enquiriesEnabled).toBe(false)
    expect(getRuntimeConfig({ NODE_ENV: 'production', ENABLE_ENQUIRIES: 'true' }).enquiriesEnabled).toBe(true)
  })

  it('allows enquiries by default outside production', () => {
    expect(getRuntimeConfig({ NODE_ENV: 'development' }).enquiriesEnabled).toBe(true)
    expect(getRuntimeConfig({ NODE_ENV: 'test' }).enquiriesEnabled).toBe(true)
  })
})
