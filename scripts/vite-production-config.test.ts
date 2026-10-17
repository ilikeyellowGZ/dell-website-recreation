// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import viteConfig from '../vite.config'

afterEach(() => vi.unstubAllEnvs())

function configure(command: 'serve' | 'build', mode: string) {
  if (typeof viteConfig !== 'function') throw new Error('Expected a Vite configuration factory')
  return viteConfig({ command, mode, isPreview: false })
}

describe('Vite production build gate', () => {
  it.each(['', 'http://api.example.com', 'https://api.example.com/api', 'https://%2A.example.com'])(
    'fails the production build configuration for API origin %s', (origin) => {
      vi.stubEnv('VITE_API_BASE_URL', origin)
      expect(() => configure('build', 'production')).toThrow(/VITE_API_BASE_URL/)
    },
  )

  it('uses the production API origin when no environment override is set', () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined)
    expect(() => configure('build', 'production')).not.toThrow()
  })

  it('allows an HTTPS API origin for production builds', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://gauvis-api.onrender.com/')
    expect(() => configure('build', 'production')).not.toThrow()
  })

  it('does not bypass production validation for a custom build mode', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    expect(() => configure('build', 'staging')).toThrow(/VITE_API_BASE_URL/)
  })

  it('allows local development and the test runner to omit the API origin', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    expect(() => configure('serve', 'development')).not.toThrow()
    expect(() => configure('serve', 'test')).not.toThrow()
  })
})
