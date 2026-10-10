type EnquiryAvailabilityInput = {
  production: boolean
  value?: string
}

export function areEnquiriesEnabled({ production, value }: EnquiryAvailabilityInput): boolean {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return !production
}

export const enquiriesEnabled = areEnquiriesEnabled({
  production: import.meta.env.PROD,
  value: import.meta.env.VITE_ENABLE_ENQUIRIES,
})
