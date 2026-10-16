type ApiPath = `/api/${string}`

export function resolveApiUrl(
  path: ApiPath,
  configuredOrigin: string | undefined,
  production = import.meta.env.PROD,
): string {
  if (!configuredOrigin) return path

  const configurationError = new Error(
    'VITE_API_BASE_URL must be an absolute API origin without credentials, a path, query, or fragment; HTTPS is required in production.',
  )
  let origin: URL
  try {
    origin = new URL(configuredOrigin)
  } catch {
    throw configurationError
  }

  if (
    (origin.protocol !== 'https:' && (production || origin.protocol !== 'http:')) ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.href.includes('?') ||
    origin.href.includes('#')
  ) {
    throw configurationError
  }

  return `${origin.origin}${path}`
}

export function apiUrl(path: ApiPath): string {
  return resolveApiUrl(path, import.meta.env.VITE_API_BASE_URL)
}
