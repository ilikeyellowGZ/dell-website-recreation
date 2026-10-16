export type TrustProxySetting = false | number

export type RuntimeConfig = {
  enquiriesEnabled: boolean
  frontendOrigins: ReadonlySet<string>
  isProduction: boolean
  serveFrontend: boolean
  trustProxy: TrustProxySetting
}

function parseBooleanSetting(name: string, value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return fallback
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  throw new Error(`${name} must be either true or false.`)
}

export function parseFrontendOrigins(value: string | undefined, isProduction: boolean): ReadonlySet<string> {
  const normalized = value?.trim()
  if (!normalized && !isProduction) return new Set()

  const invalidOrigin = () => new Error(
    'FRONTEND_ORIGIN must contain one or more absolute HTTPS origins without wildcards, credentials, paths, queries, or fragments.',
  )
  if (!normalized) throw invalidOrigin()

  const origins = new Set<string>()
  for (const item of normalized.split(',')) {
    const candidate = item.trim()
    // Validate the raw shape before URL parsing can erase paths or decode a wildcard host.
    if (!/^https:\/\/[^/?#\\\s%@*]+\/?$/i.test(candidate)) throw invalidOrigin()
    try {
      const url = new URL(candidate)
      if (url.protocol !== 'https:' || !url.hostname || url.hostname.includes('*') || url.username || url.password) throw invalidOrigin()
      origins.add(url.origin)
    } catch {
      throw invalidOrigin()
    }
  }
  return origins
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

  return {
    enquiriesEnabled: parseBooleanSetting('ENABLE_ENQUIRIES', environment.ENABLE_ENQUIRIES, !isProduction),
    frontendOrigins: parseFrontendOrigins(environment.FRONTEND_ORIGIN, isProduction),
    isProduction,
    serveFrontend: parseBooleanSetting('SERVE_FRONTEND', environment.SERVE_FRONTEND, !isProduction),
    trustProxy: parseTrustProxy(environment.TRUST_PROXY),
  }
}
