export type TrustProxySetting = false | number

export type RuntimeConfig = {
  enquiriesEnabled: boolean
  isProduction: boolean
  trustProxy: TrustProxySetting
}

export function parseTrustProxy(value?: string): TrustProxySetting {
  const normalized = value?.trim()
  if (!normalized) return false

  if (!/^\d+$/.test(normalized)) {
    throw new Error('TRUST_PROXY must be a positive integer hop count.')
  }

  const hops = Number(normalized)
  if (!Number.isSafeInteger(hops) || hops < 1) {
    throw new Error('TRUST_PROXY must be a positive integer hop count.')
  }

  return hops
}

export function getRuntimeConfig(environment: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const isProduction = environment.NODE_ENV === 'production'
  const configuredEnquiryState = environment.ENABLE_ENQUIRIES?.trim().toLowerCase()

  return {
    enquiriesEnabled: configuredEnquiryState ? configuredEnquiryState === 'true' : !isProduction,
    isProduction,
    trustProxy: parseTrustProxy(environment.TRUST_PROXY),
  }
}
