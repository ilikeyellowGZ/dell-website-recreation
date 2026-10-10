import { describe, expect, it } from 'vitest'
import { areEnquiriesEnabled } from './enquiryAvailability'

describe('browser enquiry availability', () => {
  it('keeps production collection disabled unless explicitly enabled', () => {
    expect(areEnquiriesEnabled({ production: true, value: undefined })).toBe(false)
    expect(areEnquiriesEnabled({ production: true, value: 'false' })).toBe(false)
    expect(areEnquiriesEnabled({ production: true, value: 'true' })).toBe(true)
  })

  it('allows local development unless explicitly disabled', () => {
    expect(areEnquiriesEnabled({ production: false, value: undefined })).toBe(true)
    expect(areEnquiriesEnabled({ production: false, value: 'false' })).toBe(false)
  })
})
